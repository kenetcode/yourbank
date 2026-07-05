"""Bank ingestion orchestration (discover + extract)."""

from __future__ import annotations

import json
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from sqlmodel import Session, select

from app.banking_models import Bank, Product, ProductUrl, ScrapeJob
from app.schemas.products import ProductData
from app.services.firecrawl_client import (
    SCRAPES_DIR,
    FirecrawlClient,
    filter_product_urls,
    get_bank_config,
    normalize_url,
)


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_or_create_bank(session: Session, bank_slug: str) -> Bank:
    bank = session.exec(select(Bank).where(Bank.slug == bank_slug)).first()
    if bank:
        return bank

    config = get_bank_config(bank_slug)
    bank = Bank(
        slug=bank_slug,
        name=config["name"],
        domain=config["domain"],
    )
    session.add(bank)
    session.commit()
    session.refresh(bank)
    return bank


def discover_bank(session: Session, bank_slug: str) -> dict[str, int]:
    bank = get_or_create_bank(session, bank_slug)
    config = get_bank_config(bank_slug)
    client = FirecrawlClient()
    exclude_patterns = config.get("exclude_patterns", [])
    counts: Counter[str] = Counter()

    for listing in config["listings"]:
        listing_url = listing["url"]
        product_type = listing["product_type"]
        url_patterns = listing["url_patterns"]

        links = client.scrape_links(listing_url)
        product_urls = filter_product_urls(
            links,
            domain=config["domain"],
            url_patterns=url_patterns,
            exclude_patterns=exclude_patterns,
            listing_url=listing_url,
        )
        counts[product_type] += len(product_urls)

        for url in product_urls:
            existing = session.exec(
                select(ProductUrl).where(
                    ProductUrl.bank_id == bank.id,
                    ProductUrl.url == url,
                )
            ).first()
            if existing:
                continue

            session.add(
                ProductUrl(
                    bank_id=bank.id,
                    url=url,
                    product_type=product_type,
                    listing_url=listing_url,
                    status="pending",
                )
            )

    session.commit()
    return dict(counts)


def ingest_webhook_product(
    session: Session,
    *,
    bank_slug: str,
    source_url: str,
    product_data: ProductData,
    raw: dict[str, Any] | None = None,
) -> tuple[str, Product]:
    """Persiste un producto ya extraído externamente (ej. n8n + Firecrawl).

    Sigue el mismo patrón de persistencia que extract_bank pero sin llamar
    Firecrawl. Retorna ("created" | "updated", product).
    """
    bank = session.exec(select(Bank).where(Bank.slug == bank_slug)).first()
    if not bank:
        domain = urlparse(source_url).netloc.removeprefix("www.")
        bank = Bank(slug=bank_slug, name=product_data.banco, domain=domain)
        session.add(bank)
        session.commit()
        session.refresh(bank)

    url = normalize_url(source_url)
    now = get_datetime_utc()

    product_url = session.exec(
        select(ProductUrl).where(
            ProductUrl.bank_id == bank.id,
            ProductUrl.url == url,
        )
    ).first()
    if product_url:
        product_url.status = "extracted"
        product_url.last_scraped_at = now
    else:
        product_url = ProductUrl(
            bank_id=bank.id,
            url=url,
            product_type=product_data.tipo_producto,
            status="extracted",
            last_scraped_at=now,
        )
    session.add(product_url)
    session.commit()
    session.refresh(product_url)

    raw_response_path: str | None = None
    if raw is not None:
        SCRAPES_DIR.mkdir(parents=True, exist_ok=True)
        raw_path = SCRAPES_DIR / f"webhook-{uuid.uuid4().hex}.json"
        raw_path.write_text(
            json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        raw_response_path = str(raw_path)

    scrape_job = ScrapeJob(
        product_url_id=product_url.id,
        status="completed",
        raw_response_path=raw_response_path,
        completed_at=now,
    )
    session.add(scrape_job)
    session.commit()
    session.refresh(scrape_job)

    existing_product = session.exec(
        select(Product).where(Product.product_url_id == product_url.id)
    ).first()
    if existing_product:
        existing_product.nombre_producto = product_data.nombre_producto
        existing_product.banco = product_data.banco
        existing_product.tipo_producto = product_data.tipo_producto
        existing_product.normalized = product_data.model_dump()
        existing_product.scrape_job_id = scrape_job.id
        existing_product.updated_at = now
        session.add(existing_product)
        session.commit()
        session.refresh(existing_product)
        return "updated", existing_product

    product = Product(
        bank_id=bank.id,
        product_url_id=product_url.id,
        scrape_job_id=scrape_job.id,
        nombre_producto=product_data.nombre_producto,
        banco=product_data.banco,
        tipo_producto=product_data.tipo_producto,
        normalized=product_data.model_dump(),
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return "created", product


def map_product_type_for_extract(product_type: str) -> str:
    if product_type == "promotion":
        return "credit_card"
    return product_type


def extract_bank(
    session: Session, bank_slug: str, limit: int
) -> list[dict[str, int | str]]:
    bank = get_or_create_bank(session, bank_slug)
    config = get_bank_config(bank_slug)
    client = FirecrawlClient()

    pending_urls = session.exec(
        select(ProductUrl)
        .where(ProductUrl.bank_id == bank.id, ProductUrl.status == "pending")
        .order_by(ProductUrl.discovered_at)
        .limit(limit)
    ).all()

    results: list[dict[str, int | str]] = []

    for product_url in pending_urls:
        scrape_job = ScrapeJob(
            product_url_id=product_url.id,
            status="running",
        )
        session.add(scrape_job)
        session.commit()
        session.refresh(scrape_job)

        try:
            extract_type = map_product_type_for_extract(product_url.product_type)
            agent_result, raw_path = client.extract_product(
                product_url.url,
                product_type=extract_type,
                bank_name=config["name"],
            )
            scrape_job.firecrawl_job_id = agent_result.id
            scrape_job.raw_response_path = str(raw_path)
            scrape_job.completed_at = get_datetime_utc()

            if not agent_result.success or not agent_result.data:
                scrape_job.status = "failed"
                scrape_job.error_message = agent_result.error or "Empty agent data"
                product_url.status = "failed"
                product_url.last_scraped_at = get_datetime_utc()
                session.add(scrape_job)
                session.add(product_url)
                session.commit()
                continue

            data = agent_result.data
            product = Product(
                bank_id=bank.id,
                product_url_id=product_url.id,
                scrape_job_id=scrape_job.id,
                nombre_producto=data.get("nombre_producto", "Unknown"),
                banco=data.get("banco", config["name"]),
                tipo_producto=data.get("tipo_producto", extract_type),
                normalized=data,
            )
            scrape_job.status = "completed"
            product_url.status = "extracted"
            product_url.last_scraped_at = get_datetime_utc()

            session.add(product)
            session.add(scrape_job)
            session.add(product_url)
            session.commit()

            results.append(
                {
                    "nombre_producto": product.nombre_producto,
                    "url": product_url.url,
                    "requisitos": len(data.get("requisitos") or []),
                    "beneficios": len(data.get("beneficios") or []),
                    "promociones": len(data.get("promociones") or []),
                }
            )
        except Exception as exc:  # noqa: BLE001
            scrape_job.status = "failed"
            scrape_job.error_message = str(exc)
            scrape_job.completed_at = get_datetime_utc()
            product_url.status = "failed"
            product_url.last_scraped_at = get_datetime_utc()
            session.add(scrape_job)
            session.add(product_url)
            session.commit()

    return results

import secrets
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.config import settings
from app.core.disclaimer import LEGAL_DISCLAIMER
from app.schemas.scrape import WebhookIngestRequest
from app.services.ingest import discover_bank, extract_bank, ingest_webhook_product

router = APIRouter(prefix="/admin/ingest", tags=["admin-ingest"])


def verify_ingest_api_key(
    x_ingest_api_key: str | None = Header(default=None, alias="X-Ingest-Api-Key"),
) -> None:
    """Auth server-to-server por API key (para n8n), sin JWT de superusuario."""
    if not settings.INGEST_WEBHOOK_API_KEY:
        raise HTTPException(
            status_code=503,
            detail=(
                "Webhook de ingesta no disponible: "
                "configure INGEST_WEBHOOK_API_KEY"
            ),
        )
    if not x_ingest_api_key or not secrets.compare_digest(
        x_ingest_api_key, settings.INGEST_WEBHOOK_API_KEY
    ):
        raise HTTPException(status_code=401, detail="API key inválida o ausente")


@router.post("/{bank_slug}/discover")
def run_discover(
    bank_slug: str,
    session: SessionDep,
    _: Any = Depends(get_current_active_superuser),
) -> dict[str, Any]:
    try:
        counts = discover_bank(session, bank_slug)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "bank_slug": bank_slug,
        "discovered_by_type": counts,
        "total": sum(counts.values()),
        "disclaimer": LEGAL_DISCLAIMER,
    }


@router.post("/{bank_slug}/extract")
def run_extract(
    bank_slug: str,
    session: SessionDep,
    limit: int = 2,
    _: Any = Depends(get_current_active_superuser),
) -> dict[str, Any]:
    if limit < 1 or limit > 50:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 50")

    try:
        results = extract_bank(session, bank_slug, limit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "bank_slug": bank_slug,
        "extracted": results,
        "count": len(results),
        "disclaimer": LEGAL_DISCLAIMER,
    }


@router.post("/webhook", dependencies=[Depends(verify_ingest_api_key)])
def run_webhook_ingest(
    body: WebhookIngestRequest,
    session: SessionDep,
) -> dict[str, Any]:
    action, product = ingest_webhook_product(
        session,
        bank_slug=body.bank_slug,
        source_url=body.source_url,
        product_data=body.product,
        raw=body.raw,
    )
    return {
        "action": action,
        "product_id": str(product.id),
        "bank_slug": body.bank_slug,
        "source_url": body.source_url,
        "disclaimer": LEGAL_DISCLAIMER,
    }

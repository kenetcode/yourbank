from __future__ import annotations

import json
import subprocess
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import yaml

from app.schemas.scrape import FirecrawlAgentResult

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "app" / "data"
BANKS_CONFIG_PATH = DATA_DIR / "banks.yaml"
PRODUCT_SCHEMA_PATH = BACKEND_ROOT / "app" / "schemas" / "product_schema.json"
SCRAPES_DIR = DATA_DIR / "scrapes"
FIRECRAWL_DIR = BACKEND_ROOT.parent / ".firecrawl"


def load_banks_config() -> dict[str, Any]:
    with BANKS_CONFIG_PATH.open(encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["banks"]


def get_bank_config(bank_slug: str) -> dict[str, Any]:
    banks = load_banks_config()
    if bank_slug not in banks:
        raise ValueError(f"Unknown bank slug: {bank_slug}")
    return banks[bank_slug]


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    path = parsed.path.rstrip("/") or "/"
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def url_matches_patterns(url: str, patterns: list[str]) -> bool:
    parsed = urlparse(url)
    target = f"{parsed.path}?{parsed.query}" if parsed.query else parsed.path
    for pattern in patterns:
        if pattern.startswith("/") and pattern.endswith("/"):
            if pattern.rstrip("/") in target:
                return True
        elif pattern.startswith("/"):
            if target.startswith(pattern) or pattern in target:
                return True
        elif pattern in url:
            return True
    return False


def url_is_excluded(url: str, exclude_patterns: list[str]) -> bool:
    return any(pattern in url for pattern in exclude_patterns)


def filter_product_urls(
    links: list[str],
    *,
    domain: str,
    url_patterns: list[str],
    exclude_patterns: list[str],
    listing_url: str,
) -> list[str]:
    listing_normalized = normalize_url(listing_url)
    seen: set[str] = set()
    results: list[str] = []

    for link in links:
        if domain not in link:
            continue
        if url_is_excluded(link, exclude_patterns):
            continue
        if not url_matches_patterns(link, url_patterns):
            continue

        normalized = normalize_url(link)
        if normalized == listing_normalized:
            continue
        if normalized in seen:
            continue

        seen.add(normalized)
        results.append(normalized)

    return sorted(results)


class FirecrawlClient:
    def __init__(self, *, work_dir: Path | None = None) -> None:
        self.work_dir = work_dir or FIRECRAWL_DIR
        self.work_dir.mkdir(parents=True, exist_ok=True)
        SCRAPES_DIR.mkdir(parents=True, exist_ok=True)

    def _run(self, args: list[str], *, timeout: int | None = None) -> subprocess.CompletedProcess[str]:
        cmd = ["firecrawl", *args]
        return subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

    def scrape_links(self, url: str) -> list[str]:
        output_path = self.work_dir / f"links-{uuid.uuid4().hex}.json"
        result = self._run(
            [
                "scrape",
                url,
                "--format",
                "links",
                "-o",
                str(output_path),
            ],
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"firecrawl scrape failed for {url}: {result.stderr or result.stdout}"
            )

        if not output_path.exists():
            return []

        raw = output_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return [line.strip() for line in raw.splitlines() if line.strip()]

        if isinstance(payload, list):
            return [str(item) for item in payload]

        links = payload.get("links") or payload.get("data", {}).get("links") or []
        return [str(link) for link in links]

    def extract_product(
        self,
        url: str,
        *,
        product_type: str,
        bank_name: str,
    ) -> tuple[FirecrawlAgentResult, Path]:
        output_path = SCRAPES_DIR / f"extract-{uuid.uuid4().hex}.json"
        prompt = (
            f"Extrae la información estructurada del producto financiero en esta página. "
            f"Banco: {bank_name}. Tipo esperado: {product_type}. "
            f"Incluye nombre, anualidad, tasa de interés, requisitos, beneficios y promociones."
        )
        result = self._run(
            [
                "agent",
                prompt,
                "--urls",
                url,
                "--schema-file",
                str(PRODUCT_SCHEMA_PATH),
                "--wait",
                "-o",
                str(output_path),
                "--json",
            ],
            timeout=600,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"firecrawl agent failed for {url}: {result.stderr or result.stdout}"
            )

        if not output_path.exists():
            raise RuntimeError(f"firecrawl agent produced no output for {url}")

        payload = json.loads(output_path.read_text(encoding="utf-8"))
        agent_result = FirecrawlAgentResult.model_validate(payload)
        return agent_result, output_path

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.products import ProductData

ScrapeJobStatus = Literal["pending", "running", "completed", "failed"]
ProductUrlStatus = Literal["pending", "extracted", "failed"]


class FirecrawlAgentResult(BaseModel):
    success: bool = False
    id: str | None = None
    status: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    creditsUsed: int | None = None
    error: str | None = None


class WebhookIngestRequest(BaseModel):
    """Payload que envía n8n (scraping externo con Firecrawl) al webhook de ingesta."""

    bank_slug: str
    source_url: str
    product: ProductData
    raw: dict[str, Any] | None = None

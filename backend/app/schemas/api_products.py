import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.schemas.products import ProductType


class ProductPublic(BaseModel):
    id: uuid.UUID
    nombre_producto: str
    banco: str
    tipo_producto: ProductType
    source_url: str | None = None
    normalized: dict[str, Any]
    last_updated: datetime | None = None
    disclaimer: str


class ProductsPublic(BaseModel):
    data: list[ProductPublic]
    count: int
    disclaimer: str


class ProductUpdate(BaseModel):
    """Campos editables de un producto (admin)."""

    nombre_producto: str | None = None
    banco: str | None = None
    tipo_producto: ProductType | None = None
    anualidad: float | None = None
    tasa_interes: float | None = None
    requisitos: list[str] | None = None
    beneficios: list[str] | None = None
    promociones: list[dict] | None = None

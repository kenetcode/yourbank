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

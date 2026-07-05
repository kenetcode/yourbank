from typing import Literal

from pydantic import BaseModel, Field

ProductType = Literal[
    "credit_card", "debit_card", "loan", "savings", "insurance"
]
UrlProductType = Literal[
    "credit_card", "debit_card", "loan", "savings", "insurance", "promotion"
]


class Promocion(BaseModel):
    comercio: str | None = None
    descuento_pct: float | None = None
    tipo_tarjeta: str | None = None
    vigencia: str | None = None
    descripcion: str | None = None


class ProductData(BaseModel):
    nombre_producto: str
    banco: str
    tipo_producto: ProductType
    anualidad: float | None = None
    tasa_interes: float | None = None
    requisitos: list[str] = Field(default_factory=list)
    beneficios: list[str] = Field(default_factory=list)
    promociones: list[Promocion] = Field(default_factory=list)

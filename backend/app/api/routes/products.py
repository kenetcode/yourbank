import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.core.disclaimer import LEGAL_DISCLAIMER
from app.repositories.product_repository import ProductRepository
from app.schemas.api_products import ProductPublic, ProductsPublic
from app.schemas.products import ProductType

router = APIRouter(prefix="/products", tags=["products"])


def _to_public(product: Any, source_url: str | None) -> ProductPublic:
    return ProductPublic(
        id=product.id,
        nombre_producto=product.nombre_producto,
        banco=product.banco,
        tipo_producto=product.tipo_producto,  # type: ignore[arg-type]
        source_url=source_url,
        normalized=product.normalized or {},
        last_updated=product.updated_at,
        disclaimer=LEGAL_DISCLAIMER,
    )


@router.get("/", response_model=ProductsPublic)
def list_products(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    tipo_producto: ProductType | None = None,
    banco: str | None = None,
) -> Any:
    repo = ProductRepository(session)
    rows = repo.list_products(
        tipo_producto=tipo_producto,
        banco=banco,
        skip=skip,
        limit=limit,
    )
    data = [_to_public(product, url) for product, url in rows]
    return ProductsPublic(data=data, count=len(data), disclaimer=LEGAL_DISCLAIMER)


@router.get("/{product_id}", response_model=ProductPublic)
def get_product(session: SessionDep, product_id: uuid.UUID) -> Any:
    repo = ProductRepository(session)
    row = repo.get_product(product_id)
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    product, url = row
    return _to_public(product, url)

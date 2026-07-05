import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.disclaimer import LEGAL_DISCLAIMER
from app.repositories.product_repository import ProductRepository
from app.schemas.api_products import ProductPublic, ProductsPublic, ProductUpdate
from app.schemas.products import ProductType

SuperUserDep = Depends(get_current_active_superuser)

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


@router.put("/{product_id}", response_model=ProductPublic)
def update_product(
    session: SessionDep,
    product_id: uuid.UUID,
    body: ProductUpdate,
    _: Any = SuperUserDep,
) -> Any:
    repo = ProductRepository(session)
    product = repo.update_product(
        product_id,
        nombre_producto=body.nombre_producto,
        banco=body.banco,
        tipo_producto=body.tipo_producto,
        anualidad=body.anualidad,
        tasa_interes=body.tasa_interes,
        requisitos=body.requisitos,
        beneficios=body.beneficios,
        promociones=body.promociones,
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    row = repo.get_product(product_id)
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    product, url = row
    return _to_public(product, url)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    session: SessionDep,
    product_id: uuid.UUID,
    _: Any = SuperUserDep,
) -> Response:
    repo = ProductRepository(session)
    deleted = repo.delete_product(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

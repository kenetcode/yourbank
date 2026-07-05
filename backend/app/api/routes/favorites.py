import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.banking_models import Product, ProductUrl, UserFavorite
from app.core.disclaimer import LEGAL_DISCLAIMER
from app.schemas.api_products import ProductPublic, ProductsPublic

router = APIRouter(prefix="/users/me/favorites", tags=["favorites"])


def _to_public(product: Product, source_url: str | None) -> ProductPublic:
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
def list_my_favorites(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Lista los productos marcados como favoritos por el usuario actual.
    """
    statement = (
        select(Product, ProductUrl.url)
        .join(UserFavorite, UserFavorite.product_id == Product.id)
        .join(ProductUrl, Product.product_url_id == ProductUrl.id)
        .where(UserFavorite.user_id == current_user.id)
        .order_by(UserFavorite.created_at.desc())
    )
    rows = session.exec(statement).all()
    data = [_to_public(product, url) for product, url in rows]
    return ProductsPublic(data=data, count=len(data), disclaimer=LEGAL_DISCLAIMER)


@router.post("/{product_id}", response_model=ProductPublic)
def add_favorite(
    product_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Marca un producto como favorito del usuario actual.

    Es idempotente: si ya era favorito, no falla ni lo duplica.
    """
    row = (
        select(Product, ProductUrl.url)
        .join(ProductUrl, Product.product_url_id == ProductUrl.id)
        .where(Product.id == product_id)
    )
    result = session.exec(row).first()
    if not result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product, url = result

    existing = session.exec(
        select(UserFavorite).where(
            UserFavorite.user_id == current_user.id,
            UserFavorite.product_id == product_id,
        )
    ).first()
    if not existing:
        favorite = UserFavorite(user_id=current_user.id, product_id=product_id)
        session.add(favorite)
        session.commit()

    return _to_public(product, url)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    product_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Response:
    """
    Quita un producto de los favoritos del usuario actual.

    Es idempotente: si no existía, igual responde 204.
    """
    existing = session.exec(
        select(UserFavorite).where(
            UserFavorite.user_id == current_user.id,
            UserFavorite.product_id == product_id,
        )
    ).first()
    if existing:
        session.delete(existing)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

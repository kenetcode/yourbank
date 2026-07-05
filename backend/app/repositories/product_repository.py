from __future__ import annotations

import uuid
from typing import Any

from sqlmodel import Session, col, select

from app.banking_models import Product, ProductUrl
from app.schemas.products import ProductType


class ProductRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_products(
        self,
        *,
        tipo_producto: ProductType | None = None,
        banco: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[tuple[Product, str | None]]:
        statement = (
            select(Product, ProductUrl.url)
            .join(ProductUrl, Product.product_url_id == ProductUrl.id)
            .order_by(Product.updated_at.desc())
        )
        if tipo_producto:
            statement = statement.where(Product.tipo_producto == tipo_producto)
        if banco:
            statement = statement.where(col(Product.banco).ilike(f"%{banco}%"))
        statement = statement.offset(skip).limit(limit)
        return list(self.session.exec(statement).all())

    def get_product(self, product_id: uuid.UUID) -> tuple[Product, str | None] | None:
        statement = (
            select(Product, ProductUrl.url)
            .join(ProductUrl, Product.product_url_id == ProductUrl.id)
            .where(Product.id == product_id)
        )
        row = self.session.exec(statement).first()
        return row if row else None

    def search_candidates(
        self,
        query: str,
        *,
        limit: int = 8,
    ) -> list[tuple[Product, str | None]]:
        tokens = [t.lower() for t in query.split() if len(t) > 2]
        rows = self.list_products(limit=200)
        if not tokens:
            return rows[:limit]

        scored: list[tuple[int, tuple[Product, str | None]]] = []
        for product, url in rows:
            haystack = " ".join(
                [
                    product.nombre_producto,
                    product.banco,
                    product.tipo_producto,
                    " ".join(product.normalized.get("beneficios") or []),
                    " ".join(product.normalized.get("requisitos") or []),
                ]
            ).lower()
            score = sum(1 for token in tokens if token in haystack)
            if score:
                scored.append((score, (product, url)))

        scored.sort(key=lambda item: item[0], reverse=True)
        if scored:
            return [row for _, row in scored[:limit]]
        return rows[:limit]

    @staticmethod
    def normalized_dict(product: Product) -> dict[str, Any]:
        return product.normalized or {}

from __future__ import annotations

import re

from app.banking_models import Product
from app.schemas.advisor import MatchResultItem, UserProfileInput


def _parse_min_income(requirements: list[str]) -> float | None:
    for req in requirements:
        match = re.search(r"\$?\s*([\d,]+(?:\.\d+)?)", req)
        if match and any(
            kw in req.lower() for kw in ("ingreso", "salario", "mínimo", "minimo")
        ):
            return float(match.group(1).replace(",", ""))
    return None


def _goal_keywords(goal: str | None) -> set[str]:
    if not goal:
        return set()
    goal_lower = goal.lower()
    mapping = {
        "viaje": {"viaje", "millas", "lifemiles", "mileage", "aerolínea", "aerolinea"},
        "viajes": {"viaje", "millas", "lifemiles", "mileage", "aerolínea", "aerolinea"},
        "compras": {"cashback", "puntos", "multipuntos", "descuento"},
        "ahorro": {"sin membresía", "gratis", "anualidad", "0"},
        "restaurantes": {"restaurante", "comida", "descuento"},
    }
    for key, words in mapping.items():
        if key in goal_lower:
            return words
    return {w for w in goal_lower.split() if len(w) > 3}


def score_product(product: Product, profile: UserProfileInput) -> MatchResultItem:
    normalized = product.normalized or {}
    score = 50
    reasons: list[str] = []

    anualidad = normalized.get("anualidad")
    if anualidad is not None:
        if anualidad == 0:
            score += 15
            reasons.append("Sin anualidad ($0)")
        elif anualidad <= 50:
            score += 5
            reasons.append(f"Anualidad baja (${anualidad})")
        else:
            score -= 10
            reasons.append(f"Anualidad de ${anualidad}")

    requisitos = normalized.get("requisitos") or []
    min_income = _parse_min_income(requisitos)
    if profile.monthly_income and min_income:
        if profile.monthly_income >= min_income:
            score += 15
            reasons.append(f"Cumples ingreso mínimo (${min_income:,.0f})")
        else:
            score -= 20
            reasons.append(f"Ingreso mínimo ${min_income:,.0f} supera tu perfil")

    promos = normalized.get("promociones") or []
    if promos:
        bonus = min(len(promos) * 2, 15)
        score += bonus
        reasons.append(f"{len(promos)} promociones en comercios")

    beneficios = normalized.get("beneficios") or []
    goal_words = _goal_keywords(profile.goal)
    if goal_words and beneficios:
        text = " ".join(beneficios).lower()
        hits = sum(1 for w in goal_words if w in text)
        if hits:
            score += min(hits * 5, 15)
            reasons.append(f"Beneficios alineados con tu objetivo ({profile.goal})")

    if profile.goal and product.tipo_producto == "credit_card" and "tarjeta" in profile.goal.lower():
        score += 5

    tasa = normalized.get("tasa_interes")
    if tasa is not None and tasa <= 30:
        score += 5
        reasons.append(f"Tasa competitiva ({tasa}%)")

    score = max(0, min(100, score))

    return MatchResultItem(
        product_id=str(product.id),
        nombre_producto=product.nombre_producto,
        banco=product.banco,
        tipo_producto=product.tipo_producto,
        score=score,
        reasons=reasons or ["Producto disponible en catálogo"],
    )


def rank_products(
    products: list[Product],
    profile: UserProfileInput,
    *,
    limit: int = 10,
) -> list[MatchResultItem]:
    results = [score_product(p, profile) for p in products]
    results.sort(key=lambda r: r.score, reverse=True)
    return results[:limit]

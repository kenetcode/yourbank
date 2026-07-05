from __future__ import annotations

import json

from openai import OpenAI

from app.banking_models import Product
from app.core.config import settings
from app.schemas.advisor import ChatMessage, MatchResultItem, UserProfileInput
from app.services.prompts import ADVISOR_SYSTEM_PROMPT


def _format_product_context(products: list[Product]) -> str:
    blocks: list[str] = []
    for product in products:
        data = product.normalized or {}
        blocks.append(
            json.dumps(
                {
                    "id": str(product.id),
                    "nombre": product.nombre_producto,
                    "banco": product.banco,
                    "tipo": product.tipo_producto,
                    "anualidad": data.get("anualidad"),
                    "tasa_interes": data.get("tasa_interes"),
                    "requisitos": data.get("requisitos", [])[:5],
                    "beneficios": data.get("beneficios", [])[:8],
                    "promociones_count": len(data.get("promociones") or []),
                },
                ensure_ascii=False,
            )
        )
    return "\n".join(blocks)


def _format_profile(profile: UserProfileInput | None) -> str:
    if not profile:
        return "No especificado"
    return profile.model_dump_json(exclude_none=True)


def generate_advisor_reply(
    *,
    message: str,
    history: list[ChatMessage],
    products: list[Product],
    profile: UserProfileInput | None,
    match_scores: list[MatchResultItem],
) -> str:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY no configurada")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    context = _format_product_context(products)
    scores_text = json.dumps(
        [s.model_dump() for s in match_scores[:5]], ensure_ascii=False
    )

    system = (
        f"{ADVISOR_SYSTEM_PROMPT}\n\n"
        f"Perfil del usuario: {_format_profile(profile)}\n\n"
        f"Productos candidatos:\n{context}\n\n"
        f"Match scores:\n{scores_text}"
    )

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for msg in history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,  # type: ignore[arg-type]
        temperature=0.4,
        max_tokens=1200,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("OpenAI devolvió respuesta vacía")
    return content.strip()

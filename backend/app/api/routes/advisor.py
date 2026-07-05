from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.core.config import settings
from app.core.disclaimer import LEGAL_DISCLAIMER
from app.repositories.product_repository import ProductRepository
from app.schemas.advisor import (
    ChatRequest,
    ChatResponse,
    MatchRequest,
    MatchResponse,
    UserProfileInput,
)
from app.services.ai import generate_advisor_reply
from app.services.scoring import rank_products

router = APIRouter(prefix="/advisor", tags=["advisor"])


@router.post("/match", response_model=MatchResponse)
def advisor_match(session: SessionDep, body: MatchRequest) -> Any:
    repo = ProductRepository(session)
    rows = repo.list_products(limit=200)
    products = [p for p, _ in rows]

    if body.product_types:
        products = [p for p in products if p.tipo_producto in body.product_types]

    results = rank_products(products, body.profile, limit=body.limit)
    return MatchResponse(results=results, disclaimer=LEGAL_DISCLAIMER)


@router.post("/chat", response_model=ChatResponse)
def advisor_chat(session: SessionDep, body: ChatRequest) -> Any:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Asesor IA no disponible: configure OPENAI_API_KEY",
        )

    repo = ProductRepository(session)
    candidates = repo.search_candidates(body.message, limit=8)
    products = [p for p, _ in candidates]
    effective_profile = body.profile or UserProfileInput()
    match_scores = rank_products(products, effective_profile, limit=5)

    try:
        reply = generate_advisor_reply(
            message=body.message,
            history=body.history,
            products=products,
            profile=effective_profile,
            match_scores=match_scores,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return ChatResponse(
        reply=reply,
        products_used=[p.nombre_producto for p in products],
        match_scores=match_scores,
        disclaimer=LEGAL_DISCLAIMER,
    )

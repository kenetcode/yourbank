from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.products import ProductType


class UserProfileInput(BaseModel):
    monthly_income: float | None = Field(default=None, ge=0)
    goal: str | None = None
    has_credit_history: bool | None = None
    employment: Literal["formal", "informal"] | None = None


class MatchRequest(BaseModel):
    profile: UserProfileInput
    product_types: list[ProductType] | None = None
    limit: int = Field(default=10, ge=1, le=50)


class MatchResultItem(BaseModel):
    product_id: str
    nombre_producto: str
    banco: str
    tipo_producto: str
    score: int = Field(ge=0, le=100)
    reasons: list[str]


class MatchResponse(BaseModel):
    results: list[MatchResultItem]
    disclaimer: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    profile: UserProfileInput | None = None
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    products_used: list[str]
    match_scores: list[MatchResultItem] = Field(default_factory=list)
    disclaimer: str

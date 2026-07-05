import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class Bank(SQLModel, table=True):
    __tablename__ = "bank"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    slug: str = Field(unique=True, index=True, max_length=64)
    name: str = Field(max_length=255)
    domain: str = Field(max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    product_urls: list["ProductUrl"] = Relationship(back_populates="bank")
    products: list["Product"] = Relationship(back_populates="bank")


class ProductUrl(SQLModel, table=True):
    __tablename__ = "product_url"
    __table_args__ = (UniqueConstraint("bank_id", "url", name="uq_product_url_bank_url"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    bank_id: uuid.UUID = Field(foreign_key="bank.id", nullable=False, index=True)
    url: str = Field(max_length=2048)
    product_type: str = Field(max_length=32, index=True)
    listing_url: str | None = Field(default=None, max_length=2048)
    status: str = Field(default="pending", max_length=32, index=True)
    discovered_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    last_scraped_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    bank: Bank | None = Relationship(back_populates="product_urls")
    scrape_jobs: list["ScrapeJob"] = Relationship(back_populates="product_url")
    products: list["Product"] = Relationship(back_populates="product_url")


class ScrapeJob(SQLModel, table=True):
    __tablename__ = "scrape_job"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    product_url_id: uuid.UUID = Field(
        foreign_key="product_url.id", nullable=False, index=True
    )
    firecrawl_job_id: str | None = Field(default=None, max_length=128)
    status: str = Field(default="pending", max_length=32, index=True)
    raw_response_path: str | None = Field(default=None, max_length=2048)
    error_message: str | None = Field(default=None, sa_type=Text)
    started_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    completed_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    product_url: ProductUrl | None = Relationship(back_populates="scrape_jobs")
    products: list["Product"] = Relationship(back_populates="scrape_job")


class Product(SQLModel, table=True):
    __tablename__ = "product"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    bank_id: uuid.UUID = Field(foreign_key="bank.id", nullable=False, index=True)
    product_url_id: uuid.UUID = Field(
        foreign_key="product_url.id", nullable=False, index=True
    )
    scrape_job_id: uuid.UUID = Field(
        foreign_key="scrape_job.id", nullable=False, index=True
    )
    nombre_producto: str = Field(max_length=512)
    banco: str = Field(max_length=255)
    tipo_producto: str = Field(max_length=32, index=True)
    normalized: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    bank: Bank | None = Relationship(back_populates="products")
    product_url: ProductUrl | None = Relationship(back_populates="products")
    scrape_job: ScrapeJob | None = Relationship(back_populates="products")

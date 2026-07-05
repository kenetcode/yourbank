"""Add banking ingestion tables

Revision ID: a3b8c1d2e4f5
Revises: fe56fa70289e
Create Date: 2026-07-04 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a3b8c1d2e4f5"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bank",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("domain", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bank_slug"), "bank", ["slug"], unique=True)

    op.create_table(
        "product_url",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("bank_id", sa.Uuid(), nullable=False),
        sa.Column("url", sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=False),
        sa.Column(
            "product_type", sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False
        ),
        sa.Column(
            "listing_url", sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True
        ),
        sa.Column(
            "status", sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False
        ),
        sa.Column("discovered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_scraped_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["bank_id"], ["bank.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bank_id", "url", name="uq_product_url_bank_url"),
    )
    op.create_index(op.f("ix_product_url_bank_id"), "product_url", ["bank_id"])
    op.create_index(op.f("ix_product_url_product_type"), "product_url", ["product_type"])
    op.create_index(op.f("ix_product_url_status"), "product_url", ["status"])

    op.create_table(
        "scrape_job",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_url_id", sa.Uuid(), nullable=False),
        sa.Column(
            "firecrawl_job_id",
            sqlmodel.sql.sqltypes.AutoString(length=128),
            nullable=True,
        ),
        sa.Column(
            "status", sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False
        ),
        sa.Column(
            "raw_response_path",
            sqlmodel.sql.sqltypes.AutoString(length=2048),
            nullable=True,
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_url_id"], ["product_url.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scrape_job_product_url_id"), "scrape_job", ["product_url_id"])
    op.create_index(op.f("ix_scrape_job_status"), "scrape_job", ["status"])

    op.create_table(
        "product",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("bank_id", sa.Uuid(), nullable=False),
        sa.Column("product_url_id", sa.Uuid(), nullable=False),
        sa.Column("scrape_job_id", sa.Uuid(), nullable=False),
        sa.Column(
            "nombre_producto",
            sqlmodel.sql.sqltypes.AutoString(length=512),
            nullable=False,
        ),
        sa.Column("banco", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column(
            "tipo_producto", sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False
        ),
        sa.Column("normalized", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["bank_id"], ["bank.id"]),
        sa.ForeignKeyConstraint(["product_url_id"], ["product_url.id"]),
        sa.ForeignKeyConstraint(["scrape_job_id"], ["scrape_job.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_bank_id"), "product", ["bank_id"])
    op.create_index(op.f("ix_product_product_url_id"), "product", ["product_url_id"])
    op.create_index(op.f("ix_product_scrape_job_id"), "product", ["scrape_job_id"])
    op.create_index(op.f("ix_product_tipo_producto"), "product", ["tipo_producto"])


def downgrade():
    op.drop_index(op.f("ix_product_tipo_producto"), table_name="product")
    op.drop_index(op.f("ix_product_scrape_job_id"), table_name="product")
    op.drop_index(op.f("ix_product_product_url_id"), table_name="product")
    op.drop_index(op.f("ix_product_bank_id"), table_name="product")
    op.drop_table("product")
    op.drop_index(op.f("ix_scrape_job_status"), table_name="scrape_job")
    op.drop_index(op.f("ix_scrape_job_product_url_id"), table_name="scrape_job")
    op.drop_table("scrape_job")
    op.drop_index(op.f("ix_product_url_status"), table_name="product_url")
    op.drop_index(op.f("ix_product_url_product_type"), table_name="product_url")
    op.drop_index(op.f("ix_product_url_bank_id"), table_name="product_url")
    op.drop_table("product_url")
    op.drop_index(op.f("ix_bank_slug"), table_name="bank")
    op.drop_table("bank")

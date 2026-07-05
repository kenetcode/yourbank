"""Add user_favorite table

Revision ID: c6d7e8f9a012
Revises: b4c5d6e7f890
Create Date: 2026-07-04 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c6d7e8f9a012"
down_revision = "b4c5d6e7f890"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_favorite",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_user_favorite_user_product"),
    )
    op.create_index(op.f("ix_user_favorite_user_id"), "user_favorite", ["user_id"])
    op.create_index(op.f("ix_user_favorite_product_id"), "user_favorite", ["product_id"])


def downgrade():
    op.drop_index(op.f("ix_user_favorite_product_id"), table_name="user_favorite")
    op.drop_index(op.f("ix_user_favorite_user_id"), table_name="user_favorite")
    op.drop_table("user_favorite")

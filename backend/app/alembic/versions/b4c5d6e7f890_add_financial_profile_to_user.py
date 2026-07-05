"""Add financial_profile to user

Revision ID: b4c5d6e7f890
Revises: a3b8c1d2e4f5
Create Date: 2026-07-05 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b4c5d6e7f890"
down_revision = "a3b8c1d2e4f5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user",
        sa.Column(
            "financial_profile",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column("user", "financial_profile")

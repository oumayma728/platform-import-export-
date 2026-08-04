"""add logistics columns to annonces

Revision ID: f2a9c1d8e3b7
Revises: 3d6c5e6b5a1c
Create Date: 2026-07-30
"""
from alembic import op
import sqlalchemy as sa

revision: str = 'f2a9c1d8e3b7'
down_revision = '3d6c5e6b5a1c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('annonces', sa.Column('distance_km', sa.Float(), nullable=True))
    op.add_column('annonces', sa.Column('estimated_cost_usd', sa.Float(), nullable=True))
    op.add_column('annonces', sa.Column('estimated_days', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('annonces', 'estimated_days')
    op.drop_column('annonces', 'estimated_cost_usd')
    op.drop_column('annonces', 'distance_km')
"""add certifications to companies

Revision ID: c14d4b9bd61f
Revises: db56d09fe3ba
Create Date: 2026-08-20 01:45:54.694108

"""
"""add certifications to companies

Revision ID: <généré automatiquement>
Revises: <généré automatiquement, ta vraie dernière révision>
Create Date: ...

"""
from alembic import op
import sqlalchemy as sa


revision = 'c14d4b9bd61f'
down_revision = 'db56d09fe3ba'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('certifications', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'certifications')

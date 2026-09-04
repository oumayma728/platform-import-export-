"""Add retry tracking to notification_logs

Revision ID: g1h2i3j4k5l6
Revises: f2a9c1d8e3b7
Create Date: 2026-08-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g1h2i3j4k5l6'
down_revision: Union[str, Sequence[str], None] = 'f2a9c1d8e3b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notification_logs', sa.Column('tentatives', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('notification_logs', sa.Column('derniere_tentative', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('notification_logs', 'derniere_tentative')
    op.drop_column('notification_logs', 'tentatives')
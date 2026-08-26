"""add column lu

Revision ID: 3d6c5e6b5a1c
Revises: c8a6fa85e8d1
Create Date: 2026-07-29 01:45:52.162721

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d6c5e6b5a1c'
down_revision ='c8a6fa85e8d1'
branch_labels = None
depends_on =None


def upgrade() -> None:
   op.add_column('notification_logs', sa.Column('lu', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
     op.drop_column('notification_logs', 'lu')


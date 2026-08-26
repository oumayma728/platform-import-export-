"""Add compatibility columns to user_quotas

Revision ID: e8c4f0f6b2a1
Revises: cb6572636c6e
Create Date: 2026-07-13 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e8c4f0f6b2a1'
down_revision: Union[str, Sequence[str], None] = 'dff6e88af996'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_quotas', sa.Column('chats_utilises', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('user_quotas', sa.Column('chats_gratuits', sa.Integer(), nullable=True, server_default='50'))
    op.add_column('user_quotas', sa.Column('statut', sa.String(length=30), nullable=True, server_default='GRATUIT'))
    op.add_column('user_quotas', sa.Column('depense_usage', sa.Float(), nullable=True, server_default='0'))
    op.add_column('user_quotas', sa.Column('updated_at', sa.DateTime(), nullable=True))

    op.execute("""
        UPDATE user_quotas
        SET chats_utilises = COALESCE(chats_utilises, chats_used)
        WHERE chats_used IS NOT NULL
    """)
    op.execute("""
        UPDATE user_quotas
        SET chats_gratuits = COALESCE(chats_gratuits, chats_limit)
        WHERE chats_limit IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_column('user_quotas', 'updated_at')
    op.drop_column('user_quotas', 'depense_usage')
    op.drop_column('user_quotas', 'statut')
    op.drop_column('user_quotas', 'chats_gratuits')
    op.drop_column('user_quotas', 'chats_utilises')

"""Add subject and content to NotificationLog

Revision ID: f4d5b78b9a1e
Revises: e5c3fb932c0e
Create Date: 2026-09-07 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4d5b78b9a1e'
down_revision: Union[str, None] = 'e5c3fb932c0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notification_logs', sa.Column('subject', sa.String(), nullable=True))
    op.add_column('notification_logs', sa.Column('content', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('notification_logs', 'content')
    op.drop_column('notification_logs', 'subject')

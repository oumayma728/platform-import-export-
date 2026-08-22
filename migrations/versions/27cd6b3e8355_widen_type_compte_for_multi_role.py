"""widen type_compte for multi role

Revision ID: 27cd6b3e8355
Revises: c14d4b9bd61f
Create Date: 2026-08-20 11:56:55.310939

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27cd6b3e8355'
down_revision: Union[str, Sequence[str], None] = 'c14d4b9bd61f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'type_compte', type_=sa.String(50), existing_type=sa.String(20))

def downgrade() -> None:
    op.alter_column('users', 'type_compte', type_=sa.String(20), existing_type=sa.String(50))
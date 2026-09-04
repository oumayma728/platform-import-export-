"""fix multi role persistence

Revision ID: 4f2a6b8c9d01
Revises: a1b2c3d4e5f6
Create Date: 2026-08-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "4f2a6b8c9d01"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "type_compte", existing_type=sa.String(length=50), type_=sa.String(length=64), existing_nullable=True)
    op.alter_column("users", "role", existing_type=sa.String(length=50), type_=sa.String(length=64), existing_nullable=False)

    # Réconcilie les anciennes lignes : type_compte reste prioritaire quand présent.
    op.execute("""
        UPDATE users
        SET role = type_compte
        WHERE type_compte IS NOT NULL
          AND BTRIM(type_compte) <> ''
          AND role IS DISTINCT FROM type_compte
    """)


def downgrade() -> None:
    op.alter_column("users", "role", existing_type=sa.String(length=64), type_=sa.String(length=50), existing_nullable=False)
    op.alter_column("users", "type_compte", existing_type=sa.String(length=64), type_=sa.String(length=50), existing_nullable=True)

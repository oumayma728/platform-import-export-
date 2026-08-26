"""add reference options

Revision ID: a1b2c3d4e5f6
Revises: 833b0df0cc9d
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "833b0df0cc9d"
branch_labels = None
depends_on = None

SEED = {
    "quantity_unit": [("kg","Kg"),("g","g"),("tonne","Tonne"),("L","Litre"),("m3","m³"),("piece","Pièce")],
    "currency": [("TND","TND"),("EUR","EUR"),("USD","USD"),("GBP","GBP")],
    "category": [("Agroalimentaire","Agroalimentaire"),("Énergie","Énergie"),("Textile","Textile"),("Électronique","Électronique"),("Automobile","Automobile"),("Cosmétique","Cosmétique"),("Construction","Construction"),("Machines industrielles","Machines industrielles"),("Emballage & Logistique","Emballage & Logistique")],
    "incoterm": [("EXW","EXW"),("FOB","FOB"),("CIF","CIF")],
    "country": [("Tunisie","🇹🇳 Tunisie"),("France","🇫🇷 France"),("Italie","🇮🇹 Italie"),("Espagne","🇪🇸 Espagne"),("Allemagne","🇩🇪 Allemagne"),("Belgique","🇧🇪 Belgique"),("Pays-Bas","🇳🇱 Pays-Bas"),("Maroc","🇲🇦 Maroc"),("Algérie","🇩🇿 Algérie"),("Égypte","🇪🇬 Égypte"),("Turquie","🇹🇷 Turquie"),("Chine","🇨🇳 Chine"),("Inde","🇮🇳 Inde"),("États-Unis","🇺🇸 États-Unis"),("Canada","🇨🇦 Canada")],
}

def upgrade():
    op.create_table(
        "reference_options",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("kind", sa.String(length=30), nullable=False),
        sa.Column("value", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=150), nullable=False),
        sa.Column("is_custom", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("kind", "value", name="uq_reference_option_kind_value"),
    )
    op.create_index("ix_reference_options_kind", "reference_options", ["kind"])
    table = sa.table(
        "reference_options",
        sa.column("kind", sa.String), sa.column("value", sa.String), sa.column("label", sa.String), sa.column("is_custom", sa.Boolean)
    )
    rows=[]
    for kind, values in SEED.items():
        rows += [{"kind":kind,"value":v,"label":l,"is_custom":False} for v,l in values]
    op.bulk_insert(table, rows)

def downgrade():
    op.drop_index("ix_reference_options_kind", table_name="reference_options")
    op.drop_table("reference_options")

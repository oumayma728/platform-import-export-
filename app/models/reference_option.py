from sqlalchemy import Column, Integer, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.config.database import Base


class ReferenceOption(Base):
    __tablename__ = "reference_options"
    __table_args__ = (
        UniqueConstraint("kind", "value", name="uq_reference_option_kind_value"),
    )

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(30), nullable=False, index=True)
    value = Column(String(100), nullable=False)
    label = Column(String(150), nullable=False)
    is_custom = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

from pydantic import BaseModel, Field, field_validator

ALLOWED_KINDS = {
    "quantity_unit",
    "currency",
    "country",
    "category",
    "incoterm",
}


class ReferenceOptionCreate(BaseModel):
    value: str = Field(min_length=1, max_length=100)
    label: str | None = Field(default=None, max_length=150)

    @field_validator("value")
    @classmethod
    def normalize_value(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("La valeur ne peut pas être vide")
        return value


class ReferenceOptionResponse(BaseModel):
    id: int
    kind: str
    value: str
    label: str
    is_custom: bool

    class Config:
        from_attributes = True

from pydantic import BaseModel, EmailStr, Field


class EmailSignupInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=255)


class EmailLoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

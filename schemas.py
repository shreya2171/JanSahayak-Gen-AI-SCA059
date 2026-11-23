"""Pydantic models: these validate every request body before our code touches it."""
import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

Language = Literal["en", "hi", "kn"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    language: Language = "en"

    @field_validator("password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
            raise ValueError("Password must contain at least one letter and one digit.")
        return v

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return re.sub(r"[<>]", "", v).strip()


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class ProfileIn(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    language: Optional[Language] = None
    age_group: Optional[str] = Field(default=None, max_length=20)
    state: Optional[str] = Field(default=None, max_length=60)
    occupation: Optional[str] = Field(default=None, max_length=60)
    category: Optional[str] = Field(default=None, max_length=40)   # student, farmer, ...
    income_range: Optional[str] = Field(default=None, max_length=30)
    gender: Optional[str] = Field(default=None, max_length=20)


class ChatIn(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    language: Language = "en"

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        v = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", v).strip()
        if len(v) < 2:
            raise ValueError("Question is too short.")
        return v


class SchemeIn(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    category: str = Field(min_length=3, max_length=80)
    target_group: Optional[str] = Field(default=None, max_length=60)
    min_age: Optional[int] = Field(default=None, ge=0, le=120)
    max_age: Optional[int] = Field(default=None, ge=0, le=120)
    income_max_lakh: Optional[float] = Field(default=None, ge=0)
    state: Optional[str] = Field(default="All India", max_length=100)
    gender: Optional[str] = Field(default="any", max_length=20)
    description: Optional[str] = Field(default=None, max_length=4000)
    benefits: Optional[str] = Field(default=None, max_length=4000)
    eligibility: Optional[str] = Field(default=None, max_length=4000)
    documents: Optional[str] = Field(default=None, max_length=4000)
    application_process: Optional[str] = Field(default=None, max_length=4000)
    official_website: Optional[str] = Field(default=None, max_length=300)
    source_url: Optional[str] = Field(default=None, max_length=500)
    last_verified: Optional[str] = Field(default=None, max_length=20)
    verification_status: Literal["verified", "partially_verified", "low_confidence", "unverified"] = "unverified"
    verification_notes: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("official_website", "source_url")
    @classmethod
    def must_be_http(cls, v):
        if v and not re.match(r"^https?://", v):
            raise ValueError("URL must start with http:// or https://")
        return v


class FeedbackIn(BaseModel):
    kind: Literal["rating", "report"]
    message_id: Optional[int] = None
    scheme_id: Optional[int] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("comment")
    @classmethod
    def clean_comment(cls, v):
        return re.sub(r"[<>]", "", v).strip() if v else v


class FeedbackStatusIn(BaseModel):
    status: Literal["open", "reviewed", "resolved"]

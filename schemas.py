import html
from pydantic import BaseModel, Field, field_validator
from typing import List

class BaseSecuredModel(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def sanitize_strings(cls, value):
        if isinstance(value, str):
            return html.escape(value.strip())
        if isinstance(value, list):
            return [html.escape(item.strip()) if isinstance(item, str) else item for item in value]
        return value

class UserProfile(BaseSecuredModel):
    user_id: str = Field(..., min_length=3, max_length=64)
    current_title: str = Field(..., min_length=2, max_length=100)
    extracted_skills: List[str] = Field(..., max_items=100)
    experience_years: int = Field(..., ge=0, le=60)
    profile_summary: str = Field(..., max_length=1000)

class CareerNode(BaseSecuredModel):
    id: str = Field(..., pattern=r"^node_[a-zA-Z0-9_\-]+$")
    job_title: str = Field(..., min_length=2, max_length=100)
    is_current: bool

class TransitionRequirements(BaseSecuredModel):
    skills_to_acquire: List[str] = Field(..., max_items=50)
    recommended_courses: List[str] = Field(..., max_items=20)
    estimated_time_months: int = Field(..., ge=1, le=48)

class CareerEdge(BaseSecuredModel):
    source: str = Field(..., pattern=r"^node_[a-zA-Z0-9_\-]+$")
    target: str = Field(..., pattern=r"^node_[a-zA-Z0-9_\-]+$")
    transition_requirements: TransitionRequirements

class CareerGraphResponse(BaseSecuredModel):
    graph_id: str = Field(..., min_length=12, max_length=64)
    root_node_id: str = Field(..., pattern=r"^node_[a-zA-Z0-9_\-]+$")
    nodes: List[CareerNode] = Field(..., min_items=1, max_items=30)
    edges: List[CareerEdge] = Field(..., max_items=50)



# --------------------------------------------------------------------------- #
#  Certification schemas (for on-click enrichment)
# --------------------------------------------------------------------------- #

class CertificationItem(BaseSecuredModel):
    id: str = Field(..., pattern=r"^cert_[a-zA-Z0-9_\-]+$")
    name: str = Field(..., min_length=2, max_length=120)
    provider: str         # e.g. Microsoft, AWS, Google, Linux Foundation
    difficulty: str       # Beginner | Intermediate | Advanced
    estimated_hours: int  # total study hours
    skills_covered: List[str]
    exam_code: str        # e.g. AZ-204, CKA, AWS-SAA-C03  (empty string if none)


class CertificationsRequest(BaseModel):
    """Request body for POST /api/v1/certifications"""
    job_title: str
    skills_to_acquire: List[str]


class CertificationsResponse(BaseModel):
    """Response from POST /api/v1/certifications"""
    certifications: List[CertificationItem]


# --------------------------------------------------------------------------- #
#  Responsibility schemas (for on-click enrichment)
# --------------------------------------------------------------------------- #

class ResponsibilityDetails(BaseSecuredModel):
    id: str = Field(..., pattern=r"^resp_[a-zA-Z0-9_\-]+$")
    core_responsibilities: List[str]
    people_managed: int  # 0 if individual contributor
    budget_managed: str

class ResponsibilitiesRequest(BaseModel):
    """Request body for POST /api/v1/responsibilities"""
    job_title: str

class ResponsibilitiesResponse(BaseModel):
    """Response from POST /api/v1/responsibilities"""
    responsibility: ResponsibilityDetails

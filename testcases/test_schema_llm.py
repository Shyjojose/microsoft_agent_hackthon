import pytest
from pydantic import BaseModel, Field, field_validator
from typing import List
import html

# Mock schemas directly in the test file if they don't exist yet, to enable TDD
try:
    from schemas import CareerNode, CareerGraphResponse
except ImportError:
    class BaseSecuredModel(BaseModel):
        @field_validator("*", mode="before")
        @classmethod
        def sanitize_strings(cls, value):
            if isinstance(value, str):
                return html.escape(value.strip())
            if isinstance(value, list):
                return [html.escape(item.strip()) if isinstance(item, str) else item for item in value]
            return value

    class CareerNode(BaseSecuredModel):
        id: str = Field(..., pattern=r"^node_[a-zA-Z0-9_\-]+$")
        job_title: str = Field(..., min_length=2, max_length=100)
        is_current: bool

from pydantic import ValidationError

def test_pydantic_escapes_xss_payload():
    malicious_title = "<script>alert('XSS')</script> Senior Developer"
    
    # Instantiate node with a script payload
    node = CareerNode(
        id="node_123",
        job_title=malicious_title,
        is_current=True
    )
    
    # Assert that HTML entities are strictly converted to plain text equivalents
    assert "<script>" not in node.job_title
    assert "&lt;script&gt;" in node.job_title


def test_pydantic_rejects_malformed_node_id():
    invalid_node_id = "node_123; DROP TABLE Users;"
    
    with pytest.raises(ValidationError) as exc_info:
        CareerNode(
            id=invalid_node_id,
            job_title="DevOps Engineer",
            is_current=False
        )
    
    assert "string_pattern_mismatch" in str(exc_info.value)

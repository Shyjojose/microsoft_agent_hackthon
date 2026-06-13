import pytest
from fastapi.testclient import TestClient
# We will import app from main, assuming main.py will be implemented next
try:
    from main import app
except ImportError:
    from fastapi import FastAPI
    app = FastAPI()

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def valid_pdf_header():
    # Valid %PDF- magic number followed by dummy content
    return b"%PDF-1.7\n%Lorem ipsum dolor sit amet..."

@pytest.fixture
def valid_docx_header():
    # Valid PK.. magic number followed by dummy content
    return b"PK\x03\x04\nLorem ipsum dolor sit amet..."

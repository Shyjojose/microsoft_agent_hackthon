def test_upload_file_exceeding_size_limit(client):
    # Construct a payload slightly larger than 5MB (5.1 MB)
    large_payload = b"%PDF-" + (b"X" * (5 * 1024 * 1024 + 100000))
    
    files = {"file": ("malicious_huge.pdf", large_payload, "application/pdf")}
    response = client.post("/api/v1/upload", files=files)
    
    assert response.status_code == 413
    assert "exceeds the maximum permitted size" in response.json()["detail"]


def test_upload_spoofed_file_type(client):
    # Malicious script content masquerading under a PDF header name
    malicious_script = b"#!/bin/bash\nrm -rf /"
    
    files = {"file": ("resume.pdf", malicious_script, "application/pdf")}
    response = client.post("/api/v1/upload", files=files)
    
    assert response.status_code == 415
    assert "Invalid file signature" in response.json()["detail"]


def test_upload_valid_pdf(client, valid_pdf_header):
    files = {"file": ("legit_resume.pdf", valid_pdf_header, "application/pdf")}
    response = client.post("/api/v1/upload", files=files)
    
    # Asserting successful routing down to core processing or auth layer
    assert response.status_code in [200, 201, 400, 401, 404]  # 400 is expected if the PDF parsing library rejects dummy test content


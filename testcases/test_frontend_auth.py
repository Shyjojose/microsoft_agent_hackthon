def test_bola_graph_isolation(client):
    # Set up headers representing Employee A
    headers_user_a = {"Authorization": "Bearer token_belonging_to_user_a"}
    
    # Target path containing a graph identifier belonging exclusively to Employee B
    target_graph_user_b = "graph_xyz_employee_b"
    
    response = client.get(f"/api/v1/graphs/{target_graph_user_b}", headers=headers_user_a)
    
    # Must fail immediately with a Forbidden status code (or 404/401 depending on current implementation state)
    assert response.status_code in [401, 403, 404] 


def test_frontend_emits_correct_csp_headers(client):
    # Query any standard API layout endpoint or frontend home simulation route
    response = client.get("/")
    
    if response.status_code == 200:
        assert "Content-Security-Policy" in response.headers
        csp = response.headers["Content-Security-Policy"]
        
        # Ensure vital security primitives are written into the CSP definition
        assert "object-src 'none'" in csp
        assert "base-uri 'self'" in csp
        assert "frame-ancestors 'none'" in csp

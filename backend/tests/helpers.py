"""Shared test helper functions."""


def create_user(client, email="user@test.com", password="password123", role="user"):
    """Register a user and return the response."""
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "role": role},
    )


def login(client, email="user@test.com", password="password123"):
    """Log in and return the access token string."""
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    return resp.get_json().get("token", "")


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

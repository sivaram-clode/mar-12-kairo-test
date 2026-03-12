"""Tests for /api/auth endpoints."""
import pytest
from tests.helpers import create_user, login, auth_header


class TestRegister:
    def test_register_success(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "new@test.com", "password": "secret123"},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert "token" in data
        assert data["user"]["email"] == "new@test.com"
        assert data["user"]["role"] == "user"

    def test_register_admin_role(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "admin@test.com", "password": "secret123", "role": "admin"},
        )
        assert resp.status_code == 201
        assert resp.get_json()["user"]["role"] == "admin"

    def test_register_duplicate_email(self, client):
        create_user(client)
        resp = client.post(
            "/api/auth/register",
            json={"email": "user@test.com", "password": "password123"},
        )
        assert resp.status_code == 409

    def test_register_missing_email(self, client):
        resp = client.post("/api/auth/register", json={"password": "secret123"})
        assert resp.status_code == 400

    def test_register_short_password(self, client):
        resp = client.post(
            "/api/auth/register", json={"email": "x@test.com", "password": "abc"}
        )
        assert resp.status_code == 400

    def test_register_invalid_role(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "x@test.com", "password": "secret123", "role": "superuser"},
        )
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client):
        create_user(client)
        resp = client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "password123"},
        )
        assert resp.status_code == 200
        assert "token" in resp.get_json()

    def test_login_wrong_password(self, client):
        create_user(client)
        resp = client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "wrong"},
        )
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "nobody@test.com", "password": "secret123"},
        )
        assert resp.status_code == 401


class TestMe:
    def test_me_returns_profile(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.get_json()["email"] == "user@test.com"

    def test_me_requires_auth(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

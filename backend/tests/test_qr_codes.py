"""Tests for /api/qr CRUD endpoints."""
import pytest
from tests.helpers import create_user, login, auth_header


def _create_qr(client, token, dest="https://example.com", label="My QR"):
    return client.post(
        "/api/qr/",
        json={"destination_url": dest, "label": label},
        headers=auth_header(token),
    )


class TestCreateQR:
    def test_create_success(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        resp = _create_qr(client, token)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["destination_url"] == "https://example.com"
        assert data["label"] == "My QR"
        assert "code" in data
        assert data["is_active"] is True

    def test_create_missing_destination(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        resp = client.post("/api/qr/", json={}, headers=auth_header(token))
        assert resp.status_code == 400

    def test_create_requires_auth(self, client):
        resp = client.post("/api/qr/", json={"destination_url": "https://x.com"})
        assert resp.status_code == 401


class TestListQR:
    def test_list_own_qrs(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        _create_qr(client, token, "https://a.com")
        _create_qr(client, token, "https://b.com")
        resp = client.get("/api/qr/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.get_json()) == 2

    def test_admin_sees_all(self, client):
        create_user(client, "user1@test.com", role="user")
        create_user(client, "admin@test.com", role="admin")
        token_user = login(client, "user1@test.com")
        token_admin = login(client, "admin@test.com")
        _create_qr(client, token_user, "https://user.com")
        _create_qr(client, token_admin, "https://admin.com")
        resp = client.get("/api/qr/", headers=auth_header(token_admin))
        assert resp.status_code == 200
        assert len(resp.get_json()) == 2

    def test_user_only_sees_own(self, client):
        create_user(client, "u1@test.com", role="user")
        create_user(client, "u2@test.com", role="user")
        t1 = login(client, "u1@test.com")
        t2 = login(client, "u2@test.com")
        _create_qr(client, t1, "https://u1.com")
        _create_qr(client, t2, "https://u2.com")
        resp = client.get("/api/qr/", headers=auth_header(t1))
        assert len(resp.get_json()) == 1


class TestUpdateQR:
    def test_update_destination(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr_id = _create_qr(client, token).get_json()["id"]
        resp = client.patch(
            f"/api/qr/{qr_id}",
            json={"destination_url": "https://updated.com"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.get_json()["destination_url"] == "https://updated.com"

    def test_update_forbidden_for_other_user(self, client):
        create_user(client, "owner@test.com")
        create_user(client, "thief@test.com")
        t_owner = login(client, "owner@test.com")
        t_thief = login(client, "thief@test.com")
        qr_id = _create_qr(client, t_owner).get_json()["id"]
        resp = client.patch(
            f"/api/qr/{qr_id}",
            json={"destination_url": "https://evil.com"},
            headers=auth_header(t_thief),
        )
        assert resp.status_code == 403

    def test_deactivate_qr(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr_id = _create_qr(client, token).get_json()["id"]
        resp = client.patch(
            f"/api/qr/{qr_id}",
            json={"is_active": False},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.get_json()["is_active"] is False


class TestDeleteQR:
    def test_delete_own_qr(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr_id = _create_qr(client, token).get_json()["id"]
        resp = client.delete(f"/api/qr/{qr_id}", headers=auth_header(token))
        assert resp.status_code == 200
        # Confirm gone
        resp2 = client.get(f"/api/qr/{qr_id}", headers=auth_header(token))
        assert resp2.status_code == 404

    def test_delete_forbidden(self, client):
        create_user(client, "owner@test.com")
        create_user(client, "other@test.com")
        t_owner = login(client, "owner@test.com")
        t_other = login(client, "other@test.com")
        qr_id = _create_qr(client, t_owner).get_json()["id"]
        resp = client.delete(f"/api/qr/{qr_id}", headers=auth_header(t_other))
        assert resp.status_code == 403

    def test_admin_can_delete_any(self, client):
        create_user(client, "user@test.com", role="user")
        create_user(client, "admin@test.com", role="admin")
        t_user = login(client, "user@test.com")
        t_admin = login(client, "admin@test.com")
        qr_id = _create_qr(client, t_user).get_json()["id"]
        resp = client.delete(f"/api/qr/{qr_id}", headers=auth_header(t_admin))
        assert resp.status_code == 200

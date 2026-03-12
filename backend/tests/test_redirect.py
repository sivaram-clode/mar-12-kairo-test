"""Tests for GET /r/<code> scan-tracking redirect and stats endpoint."""
import pytest
from tests.helpers import create_user, login, auth_header


def _create_qr(client, token, dest="https://example.com"):
    return client.post(
        "/api/qr/",
        json={"destination_url": dest},
        headers=auth_header(token),
    ).get_json()


class TestRedirect:
    def test_redirect_tracks_scan(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr = _create_qr(client, token)
        code = qr["code"]
        qr_id = qr["id"]

        # Follow the redirect (allow_redirects=False to inspect 302)
        resp = client.get(f"/r/{code}", follow_redirects=False)
        assert resp.status_code == 302
        assert "example.com" in resp.headers["Location"]

        # Scan count should be 1 now
        stats = client.get(f"/api/qr/{qr_id}/stats", headers=auth_header(token))
        assert stats.status_code == 200
        assert stats.get_json()["total_scans"] == 1

    def test_multiple_scans_counted(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr = _create_qr(client, token)
        code = qr["code"]
        qr_id = qr["id"]

        for _ in range(3):
            client.get(f"/r/{code}", follow_redirects=False)

        stats = client.get(f"/api/qr/{qr_id}/stats", headers=auth_header(token))
        assert stats.get_json()["total_scans"] == 3

    def test_inactive_qr_returns_404(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr = _create_qr(client, token)
        code = qr["code"]
        qr_id = qr["id"]

        # Deactivate it
        client.patch(
            f"/api/qr/{qr_id}",
            json={"is_active": False},
            headers=auth_header(token),
        )

        resp = client.get(f"/r/{code}", follow_redirects=False)
        assert resp.status_code == 404

    def test_unknown_code_returns_404(self, client):
        resp = client.get("/r/nonexistent-code", follow_redirects=False)
        assert resp.status_code == 404


class TestStats:
    def test_stats_forbidden_for_other_user(self, client):
        create_user(client, "owner@test.com")
        create_user(client, "other@test.com")
        t_owner = login(client, "owner@test.com")
        t_other = login(client, "other@test.com")
        qr_id = _create_qr(client, t_owner)["id"]
        resp = client.get(f"/api/qr/{qr_id}/stats", headers=auth_header(t_other))
        assert resp.status_code == 403

    def test_stats_structure(self, client):
        create_user(client)
        token = login(client, "user@test.com")
        qr = _create_qr(client, token)
        qr_id = qr["id"]
        code = qr["code"]
        client.get(f"/r/{code}")  # one scan

        resp = client.get(f"/api/qr/{qr_id}/stats", headers=auth_header(token))
        data = resp.get_json()
        assert "total_scans" in data
        assert "daily_scans_last_30d" in data
        assert "recent_scans" in data
        assert "qr_code" in data

    def test_stats_requires_auth(self, client):
        resp = client.get("/api/qr/1/stats")
        assert resp.status_code == 401

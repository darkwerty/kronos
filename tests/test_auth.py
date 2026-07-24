from fastapi.testclient import TestClient


def test_login_google_mock(client: TestClient):
    resp = client.post("/auth/google", json={"id_token": "mock_google_token_test_123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "dev.user@kronos.app"
    assert data["user"]["provider"] == "google"


def test_login_github_mock(client: TestClient):
    resp = client.post("/auth/github", json={"code": "mock_github_code_test_456"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "dev.github@kronos.app"
    assert data["user"]["provider"] == "github"


def test_get_me(client: TestClient):
    # Login first
    login_resp = client.post("/auth/google", json={"id_token": "mock_google_token_me"})
    token = login_resp.json()["access_token"]

    # Request /auth/me with Bearer token
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "dev.user@kronos.app"


def test_user_habit_isolation(client: TestClient):
    # User 1 creates a habit
    login_1 = client.post("/auth/google", json={"id_token": "mock_google_token_user_1"}).json()
    token_1 = login_1["access_token"]

    h1_resp = client.post(
        "/habits",
        json={"name": "Hábito Usuario 1"},
        headers={"Authorization": f"Bearer {token_1}"},
    )
    assert h1_resp.status_code == 201

    # User 2 logs in and lists habits
    login_2 = client.post("/auth/github", json={"code": "mock_github_code_user_2"}).json()
    token_2 = login_2["access_token"]

    h2_list = client.get("/habits", headers={"Authorization": f"Bearer {token_2}"}).json()
    assert len(h2_list) == 0

    # Guest lists habits
    guest_list = client.get("/habits").json()
    assert len(guest_list) == 0


def test_sync_guest_habits(client: TestClient):
    # Create guest habit
    guest_h = client.post("/habits", json={"name": "Hábito Invitado"}).json()
    habit_id = guest_h["id"]

    # Verify it exists in guest scope
    assert len(client.get("/habits").json()) == 1

    # Login user
    login = client.post("/auth/google", json={"id_token": "mock_google_token_sync"}).json()
    token = login["access_token"]

    # Sync guest habit to user
    sync_resp = client.post(
        "/auth/sync-guest-habits",
        json={"habit_ids": [habit_id]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sync_resp.status_code == 200
    assert sync_resp.json()["synced_count"] == 1

    # Now guest scope has 0 habits and user scope has 1 habit
    assert len(client.get("/habits").json()) == 0
    user_habits = client.get("/habits", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(user_habits) == 1
    assert user_habits[0]["id"] == habit_id

def test_create_habit_defaults(client):
    resp = client.post("/habits", json={"name": "Meditate"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount"] == 1.0
    assert body["unit"] == "check"
    assert body["status"] == "ACTIVE"
    assert body["current_xp"] == 0
    assert body["level"] == 1


def test_create_habit_with_target(client):
    resp = client.post("/habits", json={"name": "Pushups", "amount": 50, "unit": "Reps"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount"] == 50
    assert body["unit"] == "Reps"


def test_create_habit_duplicate_name_returns_400(client):
    client.post("/habits", json={"name": "Read"})
    resp = client.post("/habits", json={"name": "Read"})
    assert resp.status_code == 400


def test_patch_habit_updates_fields(client):
    created = client.post("/habits", json={"name": "Water", "amount": 2, "unit": "Liters"}).json()
    resp = client.patch(f"/habits/{created['id']}", json={"amount": 3})
    assert resp.status_code == 200
    body = resp.json()
    assert body["amount"] == 3
    assert body["unit"] == "Liters"
    assert body["name"] == "Water"


def test_patch_habit_rename_collision_returns_400(client):
    client.post("/habits", json={"name": "A"})
    created_b = client.post("/habits", json={"name": "B"}).json()
    resp = client.patch(f"/habits/{created_b['id']}", json={"name": "A"})
    assert resp.status_code == 400


def test_patch_habit_status_transition(client):
    created = client.post("/habits", json={"name": "Journal"}).json()
    resp = client.patch(f"/habits/{created['id']}", json={"status": "PAUSED"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "PAUSED"


def test_get_habit_not_found(client):
    resp = client.get("/habits/999")
    assert resp.status_code == 404


def test_list_habits_filters_by_status(client):
    a = client.post("/habits", json={"name": "Active habit"}).json()
    b = client.post("/habits", json={"name": "Paused habit"}).json()
    client.patch(f"/habits/{b['id']}", json={"status": "PAUSED"})

    resp = client.get("/habits", params={"status": "ACTIVE"})
    ids = [h["id"] for h in resp.json()]
    assert a["id"] in ids
    assert b["id"] not in ids

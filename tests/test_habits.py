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


def test_scheduled_target_days_filtering(client):
    # Create habit scheduled ONLY on Mondays (ISO day 1)
    mon_habit = client.post(
        "/habits", json={"name": "Monday Only Habit", "target_days": "1"}
    ).json()

    # 2026-07-20 is a Monday (ISO day 1)
    checklist_mon = client.get(
        "/habits/checklist", params={"target_date": "2026-07-20"}
    ).json()
    ids_mon = [h["id"] for h in checklist_mon]
    assert mon_habit["id"] in ids_mon

    # 2026-07-21 is a Tuesday (ISO day 2)
    checklist_tue = client.get(
        "/habits/checklist", params={"target_date": "2026-07-21"}
    ).json()
    ids_tue = [h["id"] for h in checklist_tue]
    assert mon_habit["id"] not in ids_tue


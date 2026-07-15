def test_checklist_not_logged(client):
    client.post("/habits", json={"name": "Pushups", "amount": 20, "unit": "Reps"})
    resp = client.get("/habits/checklist", params={"target_date": "2026-07-15"})
    assert resp.status_code == 200
    item = resp.json()[0]
    assert item["amount_done"] is None
    assert item["percentage"] == 0
    assert item["progress_state"] == "NOT_LOGGED"


def test_checklist_in_progress_and_completed(client):
    habit = client.post("/habits", json={"name": "Pushups", "amount": 20, "unit": "Reps"}).json()
    client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 10})

    resp = client.get("/habits/checklist", params={"target_date": "2026-07-15"})
    item = resp.json()[0]
    assert item["percentage"] == 50
    assert item["progress_state"] == "IN_PROGRESS"

    client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 20})
    resp = client.get("/habits/checklist", params={"target_date": "2026-07-15"})
    item = resp.json()[0]
    assert item["percentage"] == 100
    assert item["progress_state"] == "COMPLETED"


def test_checklist_excludes_paused_and_archived(client):
    active = client.post("/habits", json={"name": "Active"}).json()
    paused = client.post("/habits", json={"name": "Paused"}).json()
    archived = client.post("/habits", json={"name": "Archived"}).json()
    client.patch(f"/habits/{paused['id']}", json={"status": "PAUSED"})
    client.patch(f"/habits/{archived['id']}", json={"status": "ARCHIVED"})

    resp = client.get("/habits/checklist", params={"target_date": "2026-07-15"})
    ids = [h["id"] for h in resp.json()]
    assert active["id"] in ids
    assert paused["id"] not in ids
    assert archived["id"] not in ids

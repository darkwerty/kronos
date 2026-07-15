def test_post_log_creates_snapshot(client):
    habit = client.post("/habits", json={"name": "Pushups", "amount": 20, "unit": "Reps"}).json()
    resp = client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 10})
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount_done"] == 10
    assert body["target_snapshot"] == 20
    assert body["unit_snapshot"] == "Reps"


def test_post_log_omitted_amount_inherits_blueprint(client):
    habit = client.post("/habits", json={"name": "Meditate", "amount": 1, "unit": "check"}).json()
    resp = client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15"})
    assert resp.status_code == 201
    assert resp.json()["amount_done"] == 1


def test_post_log_upserts_same_date(client):
    habit = client.post("/habits", json={"name": "Pushups", "amount": 20, "unit": "Reps"}).json()
    client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 5})
    resp = client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 15})
    assert resp.status_code == 201
    assert resp.json()["amount_done"] == 15

    checklist = client.get("/habits/checklist", params={"target_date": "2026-07-15"}).json()
    assert checklist[0]["amount_done"] == 15


def test_snapshot_is_immutable_after_blueprint_change(client):
    habit = client.post("/habits", json={"name": "Pushups", "amount": 20, "unit": "Reps"}).json()
    client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 20})

    client.patch(f"/habits/{habit['id']}", json={"amount": 100})

    resp = client.get("/habits/checklist", params={"target_date": "2026-07-15"})
    item = resp.json()[0]
    assert item["target_snapshot"] == 20
    assert item["percentage"] == 100


def test_delete_log_removes_entry(client):
    habit = client.post("/habits", json={"name": "Pushups", "amount": 20, "unit": "Reps"}).json()
    client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 20})

    resp = client.delete(f"/habits/{habit['id']}/logs/2026-07-15")
    assert resp.status_code == 204

    checklist = client.get("/habits/checklist", params={"target_date": "2026-07-15"}).json()
    assert checklist[0]["amount_done"] is None


def test_delete_log_not_found(client):
    habit = client.post("/habits", json={"name": "Pushups"}).json()
    resp = client.delete(f"/habits/{habit['id']}/logs/2026-07-15")
    assert resp.status_code == 404


def test_cannot_log_progress_on_paused_habit(client):
    habit = client.post("/habits", json={"name": "Pushups"}).json()
    client.patch(f"/habits/{habit['id']}", json={"status": "PAUSED"})

    resp = client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15"})
    assert resp.status_code == 400


def test_xp_and_level_go_up_and_down_symmetrically(client):
    habit = client.post("/habits", json={"name": "Pushups", "amount": 10, "unit": "Reps"}).json()

    log_resp = client.post(f"/habits/{habit['id']}/logs", json={"logged_date": "2026-07-15", "amount_done": 10})
    assert log_resp.json()["habit_current_xp"] == 10
    assert log_resp.json()["habit_level"] == 1

    client.delete(f"/habits/{habit['id']}/logs/2026-07-15")
    after = client.get(f"/habits/{habit['id']}").json()
    assert after["current_xp"] == 0
    assert after["level"] == 1

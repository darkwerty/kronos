def test_list_default_categories(client):
    resp = client.get("/categories")
    assert resp.status_code == 200
    cats = resp.json()
    assert len(cats) >= 6
    names = [c["name"] for c in cats]
    assert "General" in names
    assert "Salud" in names
    assert "Trabajo" in names


def test_create_custom_category(client):
    resp = client.post(
        "/categories",
        json={"name": "Creatividad", "color": "#ec4899", "icon": "Palette"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Creatividad"
    assert body["color"] == "#ec4899"
    assert body["icon"] == "Palette"
    assert body["is_default"] is False


def test_create_category_duplicate_name(client):
    client.post("/categories", json={"name": "Musica", "color": "#10b981", "icon": "Music"})
    resp = client.post("/categories", json={"name": "Musica", "color": "#10b981", "icon": "Music"})
    assert resp.status_code == 400


def test_habit_creation_assigns_category(client):
    cats = client.get("/categories").json()
    salud_cat = next(c for c in cats if c["name"] == "Salud")

    # Create habit with specific category_id
    resp = client.post(
        "/habits",
        json={"name": "Correr", "amount": 5, "unit": "km", "category_id": salud_cat["id"]},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["category_id"] == salud_cat["id"]
    assert body["category"]["name"] == "Salud"


def test_list_habits_filter_by_category(client):
    cats = client.get("/categories").json()
    salud_cat = next(c for c in cats if c["name"] == "Salud")
    trabajo_cat = next(c for c in cats if c["name"] == "Trabajo")

    h1 = client.post(
        "/habits",
        json={"name": "Nadar", "category_id": salud_cat["id"]},
    ).json()
    h2 = client.post(
        "/habits",
        json={"name": "Codificar", "category_id": trabajo_cat["id"]},
    ).json()

    resp = client.get("/habits", params={"category_id": salud_cat["id"]})
    assert resp.status_code == 200
    ids = [h["id"] for h in resp.json()]
    assert h1["id"] in ids
    assert h2["id"] not in ids



def test_category_analytics(client):
    resp = client.get("/categories/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 6

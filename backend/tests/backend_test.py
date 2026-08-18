"""
Abqour backend regression tests.
Tests: auth, home, catalog, quiz, words, results, achievements, leaderboard,
notifications, rooms, admin endpoints (with role check).
"""
import os
import time
import random
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://abkoor-multiplayer.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "iM580"
ADMIN_PASS = "Mohammad@2021"

_state = {}


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- auth ----------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert "Abqour" in r.json().get("message", "")

    def test_admin_login(self):
        r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and data["user"]["is_admin"] is True
        _state["admin_token"] = data["access_token"]
        _state["admin_id"] = data["user"]["id"]

    def test_register_new_user(self):
        uname = f"TEST_qa_{random.randint(10000,99999)}"
        r = requests.post(f"{API}/auth/register", json={"username": uname, "password": "pass1234"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["username"] == uname and data["user"]["is_admin"] is False
        _state["user_token"] = data["access_token"]
        _state["user_id"] = data["user"]["id"]
        _state["username"] = uname

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={"username": _state["username"], "password": "abc"})
        assert r.status_code == 409

    def test_login_wrong(self):
        r = requests.post(f"{API}/auth/login", json={"username": _state["username"], "password": "wrong"})
        assert r.status_code == 401

    def test_me(self):
        r = requests.get(f"{API}/auth/me", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        assert r.json()["username"] == _state["username"]

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- catalog / home ----------
class TestCatalog:
    def test_home(self):
        r = requests.get(f"{API}/home", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        data = r.json()
        assert "user" in data and "featured" in data and "upcoming" in data and "stats" in data
        # featured should be active games
        for g in data["featured"]:
            assert g["status"] == "active"

    def test_games_list(self):
        r = requests.get(f"{API}/games")
        assert r.status_code == 200
        games = r.json()
        assert len(games) >= 8, f"expected >=8 games, got {len(games)}"

    def test_get_game_quiz(self):
        r = requests.get(f"{API}/games/quiz")
        assert r.status_code == 200
        assert r.json()["key"] == "quiz"

    def test_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        assert len(r.json()) >= 8


# ---------- games content ----------
class TestGamesContent:
    def test_quiz_questions(self):
        r = requests.get(f"{API}/quiz/questions?count=10")
        assert r.status_code == 200
        qs = r.json()
        assert 1 <= len(qs) <= 10
        q = qs[0]
        assert "text" in q and "options" in q and len(q["options"]) == 4 and "correct" in q

    def test_words(self):
        r = requests.get(f"{API}/words?count=5")
        assert r.status_code == 200
        ws = r.json()
        assert len(ws) >= 1
        assert "word" in ws[0] and "hint" in ws[0]


# ---------- results & progress ----------
class TestResults:
    def test_submit_result(self):
        payload = {"game_key": "quiz", "score": 80, "correct": 8, "total": 10, "details": {}}
        r = requests.post(f"{API}/results", headers=_headers(_state["user_token"]), json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "xp_earned" in data and "coins_earned" in data and "user" in data and "new_achievements" in data
        assert data["user"]["games_played"] >= 1
        assert data["user"]["total_score"] >= 80

    def test_mine_persists(self):
        r = requests.get(f"{API}/results/mine", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_achievements(self):
        r = requests.get(f"{API}/achievements", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        achs = r.json()
        assert len(achs) >= 1
        assert "unlocked" in achs[0]

    def test_leaderboard(self):
        r = requests.get(f"{API}/leaderboard", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        board = r.json()
        assert isinstance(board, list) and len(board) >= 1
        assert "rank" in board[0]


# ---------- notifications ----------
class TestNotifications:
    def test_admin_create_notification(self):
        payload = {"title_ar": "TEST_عنوان", "body_ar": "TEST_محتوى", "target": "all"}
        r = requests.post(f"{API}/admin/notifications", headers=_headers(_state["admin_token"]), json=payload)
        assert r.status_code == 200
        _state["notif_created"] = True

    def test_get_notifications(self):
        r = requests.get(f"{API}/notifications", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        notes = r.json()
        assert isinstance(notes, list)

    def test_mark_read(self):
        r = requests.post(f"{API}/notifications/read", headers=_headers(_state["user_token"]))
        assert r.status_code == 200 and r.json().get("ok") is True


# ---------- rooms ----------
class TestRooms:
    def test_create_room(self):
        r = requests.post(f"{API}/rooms", headers=_headers(_state["user_token"]), json={"game_key": "quiz"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "code" in data and len(str(data["code"])) == 6
        _state["room_code"] = data["code"]

    def test_get_room(self):
        r = requests.get(f"{API}/rooms/{_state['room_code']}", headers=_headers(_state["user_token"]))
        assert r.status_code == 200
        room = r.json()
        assert room["code"] == _state["room_code"] and room["status"] == "waiting"
        assert len(room["players"]) == 1

    def test_join_room(self):
        # admin joins the user-created room
        r = requests.post(f"{API}/rooms/{_state['room_code']}/join", headers=_headers(_state["admin_token"]))
        assert r.status_code == 200
        r2 = requests.get(f"{API}/rooms/{_state['room_code']}", headers=_headers(_state["admin_token"]))
        assert r2.status_code == 200
        assert len(r2.json()["players"]) == 2

    def test_get_room_404(self):
        r = requests.get(f"{API}/rooms/000000", headers=_headers(_state["user_token"]))
        assert r.status_code == 404


# ---------- admin ----------
class TestAdmin:
    def test_forbidden_for_regular(self):
        r = requests.get(f"{API}/admin/overview", headers=_headers(_state["user_token"]))
        assert r.status_code == 403

    def test_overview(self):
        r = requests.get(f"{API}/admin/overview", headers=_headers(_state["admin_token"]))
        assert r.status_code == 200
        data = r.json()
        for k in ("users", "questions", "games", "categories"):
            assert k in data

    def test_admin_users(self):
        r = requests.get(f"{API}/admin/users", headers=_headers(_state["admin_token"]))
        assert r.status_code == 200
        users = r.json()
        # hashed_password must not leak
        for u in users:
            assert "hashed_password" not in u

    def test_questions_list(self):
        r = requests.get(f"{API}/admin/questions", headers=_headers(_state["admin_token"]))
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_add_and_delete_question(self):
        text = f"TEST_ما هو ناتج {random.randint(1000,9999)} + 1؟"
        payload = {"category": "math", "text": text, "options": ["1", "2", "3", "4"], "correct": 0, "difficulty": "easy"}
        r = requests.post(f"{API}/admin/questions", headers=_headers(_state["admin_token"]), json=payload)
        assert r.status_code == 200, r.text
        qid = r.json()["id"]
        # dedup
        r2 = requests.post(f"{API}/admin/questions", headers=_headers(_state["admin_token"]), json=payload)
        assert r2.status_code == 409
        # invalid: 3 options
        bad = {**payload, "text": text + "_x", "options": ["a", "b", "c"]}
        r3 = requests.post(f"{API}/admin/questions", headers=_headers(_state["admin_token"]), json=bad)
        assert r3.status_code == 400
        # delete
        r4 = requests.delete(f"{API}/admin/questions/{qid}", headers=_headers(_state["admin_token"]))
        assert r4.status_code == 200

    def test_admin_results(self):
        r = requests.get(f"{API}/admin/results", headers=_headers(_state["admin_token"]))
        assert r.status_code == 200

    def test_cannot_delete_admin(self):
        r = requests.delete(f"{API}/admin/users/{_state['admin_id']}", headers=_headers(_state["admin_token"]))
        assert r.status_code == 400

    def test_delete_test_user(self):
        # cleanup TEST_ user
        r = requests.delete(f"{API}/admin/users/{_state['user_id']}", headers=_headers(_state["admin_token"]))
        assert r.status_code == 200

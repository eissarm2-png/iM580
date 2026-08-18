from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import random
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

import jwt
import bcrypt
from pydantic import BaseModel, Field

from seed_data import CATEGORIES, GAMES, ACHIEVEMENTS, QUESTIONS, WORDS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET_KEY']
ALGORITHM = "HS256"
TOKEN_DAYS = int(os.environ.get('ACCESS_TOKEN_DAYS', '30'))
ADMIN_USERNAME = os.environ['ADMIN_USERNAME']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------- Helpers ----------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode('utf-8')[:72], hashed.encode('utf-8'))
    except Exception:
        return False


def create_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "username": user["username"],
        "is_admin": user.get("is_admin", False),
        "iat": now_utc(),
        "exp": now_utc() + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def level_from_xp(xp: int) -> int:
    # 100 xp per level, growing lightly
    lvl = 1
    need = 100
    remaining = xp
    while remaining >= need:
        remaining -= need
        lvl += 1
        need = int(need * 1.25)
    return lvl


def xp_progress(xp: int):
    lvl = 1
    need = 100
    remaining = xp
    while remaining >= need:
        remaining -= need
        lvl += 1
        need = int(need * 1.25)
    return {"level": lvl, "current": remaining, "needed": need}


def public_user(u: dict) -> dict:
    prog = xp_progress(u.get("xp", 0))
    return {
        "id": u["id"],
        "username": u["username"],
        "is_admin": u.get("is_admin", False),
        "xp": u.get("xp", 0),
        "level": prog["level"],
        "level_current": prog["current"],
        "level_needed": prog["needed"],
        "coins": u.get("coins", 0),
        "avatar": u.get("avatar", 0),
        "games_played": u.get("games_played", 0),
        "total_score": u.get("total_score", 0),
        "stats": u.get("stats", {}),
        "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at"),
    }


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="غير مصرّح")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        uid = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="جلسة غير صالحة")
    user = await db.users.find_one({"id": uid})
    if not user or user.get("disabled"):
        raise HTTPException(status_code=401, detail="المستخدم غير موجود")
    return user


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="صلاحيات المسؤول مطلوبة")
    return user


async def decode_token_str(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return await db.users.find_one({"id": payload.get("sub")})
    except Exception:
        return None


# ---------------- Models ----------------
class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=3, max_length=128)


class GameResultIn(BaseModel):
    game_key: str
    score: int = 0
    correct: int = 0
    total: int = 0
    details: dict = {}


class QuestionIn(BaseModel):
    category: str
    text: str
    options: List[str]
    correct: int
    difficulty: str = "medium"


class QuestionUpdate(BaseModel):
    category: Optional[str] = None
    text: Optional[str] = None
    options: Optional[List[str]] = None
    correct: Optional[int] = None
    difficulty: Optional[str] = None


class NotificationIn(BaseModel):
    title_ar: str
    body_ar: str
    target: str = "all"  # all or user id


class RoomCreate(BaseModel):
    game_key: str = "quiz"


# ---------------- Startup / seeding ----------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("username", unique=True)
    await db.users.create_index("id", unique=True)
    await db.questions.create_index("category")

    # admin (idempotent)
    existing = await db.users.find_one({"username": ADMIN_USERNAME})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": ADMIN_USERNAME,
            "hashed_password": hash_password(ADMIN_PASSWORD),
            "is_admin": True, "disabled": False,
            "xp": 0, "coins": 5000, "avatar": 0,
            "games_played": 0, "total_score": 0, "stats": {},
            "created_at": now_utc(),
        })
    else:
        await db.users.update_one({"username": ADMIN_USERNAME}, {"$set": {"is_admin": True, "disabled": False}})

    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many([dict(c) for c in CATEGORIES])
    if await db.games.count_documents({}) == 0:
        await db.games.insert_many([dict(g) for g in GAMES])
    if await db.achievements.count_documents({}) == 0:
        await db.achievements.insert_many([dict(a) for a in ACHIEVEMENTS])
    if await db.words.count_documents({}) == 0:
        await db.words.insert_many([dict(w) for w in WORDS])
    if await db.questions.count_documents({}) == 0:
        docs = [{"id": str(uuid.uuid4()), **dict(q), "created_at": now_utc()} for q in QUESTIONS]
        await db.questions.insert_many(docs)
    if await db.settings.count_documents({}) == 0:
        await db.settings.insert_one({
            "id": "app", "app_name": "عبقور", "maintenance": False,
            "daily_xp_bonus": 20, "footer": "تم تطوير هذا التطبيق بواسطة أبو خلف",
        })
    logger.info("Abqour seed complete")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------------- Auth ----------------
@api_router.get("/")
async def root():
    return {"message": "Abqour API"}


@api_router.post("/auth/register")
async def register(body: Credentials):
    existing = await db.users.find_one({"username": body.username})
    if existing:
        raise HTTPException(status_code=409, detail="اسم المستخدم مستخدم بالفعل")
    user = {
        "id": str(uuid.uuid4()),
        "username": body.username,
        "hashed_password": hash_password(body.password),
        "is_admin": False, "disabled": False,
        "xp": 0, "coins": 100, "avatar": random.randint(0, 5),
        "games_played": 0, "total_score": 0, "stats": {},
        "created_at": now_utc(),
    }
    await db.users.insert_one(user)
    return {"access_token": create_token(user), "user": public_user(user)}


@api_router.post("/auth/login")
async def login(body: Credentials):
    user = await db.users.find_one({"username": body.username})
    if not user or user.get("disabled") or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    return {"access_token": create_token(user), "user": public_user(user)}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# ---------------- Catalog ----------------
@api_router.get("/games")
async def get_games():
    games = await db.games.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return games


@api_router.get("/games/{key}")
async def get_game(key: str):
    game = await db.games.find_one({"key": key}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="اللعبة غير موجودة")
    return game


@api_router.get("/categories")
async def get_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(100)


@api_router.get("/home")
async def get_home(user: dict = Depends(get_current_user)):
    games = await db.games.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    active = [g for g in games if g["status"] == "active"]
    upcoming = [g for g in games if g["status"] == "coming_soon"]
    total_users = await db.users.count_documents({})
    # user rank by total_score
    higher = await db.users.count_documents({"total_score": {"$gt": user.get("total_score", 0)}})
    return {
        "user": public_user(user),
        "featured": active,
        "upcoming": upcoming,
        "stats": {
            "rating": 4.8,
            "active_users": total_users,
            "games_count": len(active),
            "rank": higher + 1,
        },
        "settings": await db.settings.find_one({"id": "app"}, {"_id": 0}),
    }


# ---------------- Quiz ----------------
@api_router.get("/quiz/questions")
async def quiz_questions(category: Optional[str] = None, count: int = 10):
    q = {}
    if category and category != "all":
        q["category"] = category
    docs = await db.questions.find(q, {"_id": 0}).to_list(2000)
    random.shuffle(docs)
    return docs[:max(1, min(count, 30))]


# ---------------- Word game ----------------
@api_router.get("/words")
async def get_words(count: int = 10):
    docs = await db.words.find({}, {"_id": 0}).to_list(1000)
    random.shuffle(docs)
    return docs[:max(1, min(count, 30))]


# ---------------- Results / progress ----------------
def _apply_achievements(user: dict, unlocked: list):
    return unlocked


@api_router.post("/results")
async def submit_result(body: GameResultIn, user: dict = Depends(get_current_user)):
    xp_earned = max(0, body.score // 10 + body.correct * 5)
    coins_earned = max(0, body.correct * 2)
    result = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "username": user["username"],
        "game_key": body.game_key,
        "score": body.score,
        "correct": body.correct,
        "total": body.total,
        "xp_earned": xp_earned,
        "details": body.details,
        "created_at": now_utc(),
    }
    await db.results.insert_one(result)

    stats = user.get("stats", {})
    stats[body.game_key + "_plays"] = stats.get(body.game_key + "_plays", 0) + 1
    if body.game_key == "word":
        stats["words_solved"] = stats.get("words_solved", 0) + body.correct
    perfect = body.total > 0 and body.correct == body.total

    new_xp = user.get("xp", 0) + xp_earned
    updates = {
        "$inc": {
            "xp": xp_earned,
            "coins": coins_earned,
            "games_played": 1,
            "total_score": body.score,
        },
        "$set": {"stats": stats},
    }
    await db.users.update_one({"id": user["id"]}, updates)

    # achievements
    fresh = await db.users.find_one({"id": user["id"]})
    newly = await _check_achievements(fresh, perfect)
    return {
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "user": public_user(fresh),
        "new_achievements": newly,
    }


async def _check_achievements(user: dict, perfect: bool) -> list:
    achs = await db.achievements.find({}, {"_id": 0}).to_list(100)
    owned = {ua["achievement_key"] async for ua in db.user_achievements.find({"user_id": user["id"]})}
    prog = xp_progress(user.get("xp", 0))
    stats = user.get("stats", {})
    metrics = {
        "games_played": user.get("games_played", 0),
        "level": prog["level"],
        "total_score": user.get("total_score", 0),
        "quiz_plays": stats.get("quiz_plays", 0),
        "puzzle_plays": stats.get("puzzle_plays", 0),
        "words_solved": stats.get("words_solved", 0),
        "day_streak": stats.get("day_streak", 1),
        "perfect_quiz": 1 if perfect else 0,
    }
    newly = []
    for a in achs:
        if a["key"] in owned:
            continue
        if metrics.get(a["metric"], 0) >= a["target"]:
            await db.user_achievements.insert_one({
                "user_id": user["id"], "achievement_key": a["key"], "unlocked_at": now_utc(),
            })
            await db.users.update_one({"id": user["id"]}, {"$inc": {"xp": a["xp"]}})
            newly.append(a)
    return newly


@api_router.get("/achievements")
async def list_achievements(user: dict = Depends(get_current_user)):
    achs = await db.achievements.find({}, {"_id": 0}).to_list(100)
    owned = {}
    async for ua in db.user_achievements.find({"user_id": user["id"]}):
        owned[ua["achievement_key"]] = ua.get("unlocked_at")
    for a in achs:
        a["unlocked"] = a["key"] in owned
        ul = owned.get(a["key"])
        a["unlocked_at"] = ul.isoformat() if isinstance(ul, datetime) else ul
    return achs


@api_router.get("/leaderboard")
async def leaderboard(user: dict = Depends(get_current_user)):
    top = await db.users.find({}, {"_id": 0}).sort("total_score", -1).limit(50).to_list(50)
    board = []
    for i, u in enumerate(top):
        prog = xp_progress(u.get("xp", 0))
        board.append({
            "rank": i + 1,
            "id": u["id"],
            "username": u["username"],
            "total_score": u.get("total_score", 0),
            "level": prog["level"],
            "avatar": u.get("avatar", 0),
            "is_me": u["id"] == user["id"],
        })
    return board


@api_router.get("/results/mine")
async def my_results(user: dict = Depends(get_current_user)):
    docs = await db.results.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(30).to_list(30)
    for d in docs:
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


# ---------------- Notifications ----------------
@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find(
        {"$or": [{"target": "all"}, {"target": user["id"]}]}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    read_ids = set(user.get("read_notifications", []))
    for d in docs:
        d["read"] = d["id"] in read_ids
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


@api_router.post("/notifications/read")
async def mark_read(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"$or": [{"target": "all"}, {"target": user["id"]}]}).to_list(200)
    ids = [d["id"] for d in docs]
    await db.users.update_one({"id": user["id"]}, {"$set": {"read_notifications": ids}})
    return {"ok": True}


# ---------------- Multiplayer rooms ----------------
class RoomManager:
    def __init__(self):
        self.connections: Dict[str, Dict[str, WebSocket]] = {}
        self.tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, code: str, uid: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(code, {})[uid] = ws

    def disconnect(self, code: str, uid: str):
        if code in self.connections and uid in self.connections[code]:
            del self.connections[code][uid]

    async def broadcast(self, code: str, message: dict):
        for ws in list(self.connections.get(code, {}).values()):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = RoomManager()


def gen_room_code() -> str:
    return str(random.randint(100000, 999999))


@api_router.post("/rooms")
async def create_room(body: RoomCreate, user: dict = Depends(get_current_user)):
    code = gen_room_code()
    while await db.rooms.find_one({"code": code, "status": {"$ne": "finished"}}):
        code = gen_room_code()
    room = {
        "id": str(uuid.uuid4()),
        "code": code,
        "host_id": user["id"],
        "game_key": body.game_key,
        "status": "waiting",
        "players": [{"id": user["id"], "username": user["username"], "ready": False, "score": 0, "avatar": user.get("avatar", 0)}],
        "created_at": now_utc(),
    }
    await db.rooms.insert_one(room)
    return {"code": code, "id": room["id"]}


@api_router.get("/rooms/{code}")
async def get_room(code: str, user: dict = Depends(get_current_user)):
    room = await db.rooms.find_one({"code": code}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="الغرفة غير موجودة")
    if isinstance(room.get("created_at"), datetime):
        room["created_at"] = room["created_at"].isoformat()
    return room


@api_router.post("/rooms/{code}/join")
async def join_room(code: str, user: dict = Depends(get_current_user)):
    room = await db.rooms.find_one({"code": code})
    if not room:
        raise HTTPException(status_code=404, detail="الغرفة غير موجودة")
    if room["status"] != "waiting":
        raise HTTPException(status_code=400, detail="اللعبة بدأت بالفعل")
    if not any(p["id"] == user["id"] for p in room["players"]):
        if len(room["players"]) >= 4:
            raise HTTPException(status_code=400, detail="الغرفة ممتلئة")
        room["players"].append({"id": user["id"], "username": user["username"], "ready": False, "score": 0, "avatar": user.get("avatar", 0)})
        await db.rooms.update_one({"code": code}, {"$set": {"players": room["players"]}})
    await manager.broadcast(code, {"type": "room_update", "players": room["players"], "status": room["status"]})
    return {"code": code, "id": room["id"]}


async def _run_quiz_game(code: str):
    """Server-driven multiplayer quiz flow."""
    room = await db.rooms.find_one({"code": code})
    if not room:
        return
    questions = await db.questions.find({}, {"_id": 0}).to_list(2000)
    random.shuffle(questions)
    questions = questions[:5]
    await db.rooms.update_one({"code": code}, {"$set": {"status": "playing", "answers": {}}})

    for idx, q in enumerate(questions):
        await db.rooms.update_one({"code": code}, {"$set": {"current_answers": {}}})
        await manager.broadcast(code, {
            "type": "question",
            "index": idx,
            "total": len(questions),
            "text": q["text"],
            "options": q["options"],
            "correct": q["correct"],
            "duration": 12,
        })
        await asyncio.sleep(13)
        room = await db.rooms.find_one({"code": code})
        if not room:
            return
        answers = room.get("current_answers", {})
        players = room["players"]
        for p in players:
            ans = answers.get(p["id"])
            if ans is not None and ans.get("choice") == q["correct"]:
                bonus = max(1, int(10 - (ans.get("time", 12))))
                p["score"] += 10 + bonus
        await db.rooms.update_one({"code": code}, {"$set": {"players": players}})
        await manager.broadcast(code, {"type": "scoreboard", "players": players, "correct": q["correct"]})
        await asyncio.sleep(3)

    room = await db.rooms.find_one({"code": code})
    players = sorted(room["players"], key=lambda p: p["score"], reverse=True)
    winner = players[0] if players else None
    await db.rooms.update_one({"code": code}, {"$set": {"status": "finished", "players": players}})
    await manager.broadcast(code, {"type": "game_over", "players": players, "winner": winner})
    # award xp to winner
    if winner:
        await db.users.update_one({"id": winner["id"]}, {"$inc": {"xp": 100, "coins": 50, "total_score": winner["score"]}})


@api_router.websocket("/ws/room/{code}")
async def room_ws(websocket: WebSocket, code: str, token: str):
    user = await decode_token_str(token)
    if not user:
        await websocket.close(code=4001)
        return
    uid = user["id"]
    await manager.connect(code, uid, websocket)
    room = await db.rooms.find_one({"code": code})
    if room:
        await manager.broadcast(code, {"type": "room_update", "players": room["players"], "status": room["status"]})
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            room = await db.rooms.find_one({"code": code})
            if not room:
                continue
            if action == "ready":
                for p in room["players"]:
                    if p["id"] == uid:
                        p["ready"] = not p.get("ready", False)
                await db.rooms.update_one({"code": code}, {"$set": {"players": room["players"]}})
                await manager.broadcast(code, {"type": "room_update", "players": room["players"], "status": room["status"]})
            elif action == "start":
                if room["host_id"] == uid and room["status"] == "waiting" and len(room["players"]) >= 1:
                    if all(p.get("ready") for p in room["players"] if p["id"] != room["host_id"]) or len(room["players"]) == 1:
                        if code not in manager.tasks or manager.tasks[code].done():
                            manager.tasks[code] = asyncio.create_task(_run_quiz_game(code))
            elif action == "answer":
                current = room.get("current_answers", {})
                if uid not in current:
                    current[uid] = {"choice": data.get("choice"), "time": data.get("time", 12)}
                    await db.rooms.update_one({"code": code}, {"$set": {"current_answers": current}})
            elif action == "leave":
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(code, uid)
        room = await db.rooms.find_one({"code": code})
        if room and room["status"] == "waiting":
            room["players"] = [p for p in room["players"] if p["id"] != uid]
            if room["players"]:
                await db.rooms.update_one({"code": code}, {"$set": {"players": room["players"]}})
                await manager.broadcast(code, {"type": "room_update", "players": room["players"], "status": room["status"]})
            else:
                await db.rooms.delete_one({"code": code})


# ---------------- Admin ----------------
@api_router.get("/admin/overview")
async def admin_overview(admin: dict = Depends(get_admin_user)):
    return {
        "users": await db.users.count_documents({}),
        "questions": await db.questions.count_documents({}),
        "games": await db.games.count_documents({}),
        "categories": await db.categories.count_documents({}),
        "results": await db.results.count_documents({}),
        "rooms": await db.rooms.count_documents({}),
        "notifications": await db.notifications.count_documents({}),
    }


@api_router.get("/admin/users")
async def admin_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).limit(200).to_list(200)
    for u in users:
        if isinstance(u.get("created_at"), datetime):
            u["created_at"] = u["created_at"].isoformat()
    return users


@api_router.delete("/admin/users/{uid}")
async def admin_delete_user(uid: str, admin: dict = Depends(get_admin_user)):
    target = await db.users.find_one({"id": uid})
    if target and target.get("username") == ADMIN_USERNAME:
        raise HTTPException(status_code=400, detail="لا يمكن حذف المسؤول")
    await db.users.delete_one({"id": uid})
    return {"ok": True}


@api_router.get("/admin/questions")
async def admin_questions(admin: dict = Depends(get_admin_user), category: Optional[str] = None):
    q = {}
    if category and category != "all":
        q["category"] = category
    docs = await db.questions.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    for d in docs:
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


@api_router.post("/admin/questions")
async def admin_add_question(body: QuestionIn, admin: dict = Depends(get_admin_user)):
    if len(body.options) != 4 or not (0 <= body.correct < 4):
        raise HTTPException(status_code=400, detail="يجب إدخال 4 خيارات وإجابة صحيحة")
    dup = await db.questions.find_one({"text": body.text.strip()})
    if dup:
        raise HTTPException(status_code=409, detail="السؤال موجود مسبقاً")
    doc = {"id": str(uuid.uuid4()), **body.dict(), "text": body.text.strip(), "created_at": now_utc()}
    await db.questions.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


@api_router.put("/admin/questions/{qid}")
async def admin_update_question(qid: str, body: QuestionUpdate, admin: dict = Depends(get_admin_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="لا يوجد تحديث")
    await db.questions.update_one({"id": qid}, {"$set": updates})
    return {"ok": True}


@api_router.delete("/admin/questions/{qid}")
async def admin_delete_question(qid: str, admin: dict = Depends(get_admin_user)):
    await db.questions.delete_one({"id": qid})
    return {"ok": True}


@api_router.get("/admin/results")
async def admin_results(admin: dict = Depends(get_admin_user)):
    docs = await db.results.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    for d in docs:
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


@api_router.get("/admin/rooms")
async def admin_rooms(admin: dict = Depends(get_admin_user)):
    docs = await db.rooms.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    for d in docs:
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


@api_router.post("/admin/notifications")
async def admin_add_notification(body: NotificationIn, admin: dict = Depends(get_admin_user)):
    doc = {"id": str(uuid.uuid4()), **body.dict(), "created_at": now_utc()}
    await db.notifications.insert_one(doc)
    return {"ok": True}


@api_router.get("/admin/settings")
async def admin_get_settings(admin: dict = Depends(get_admin_user)):
    return await db.settings.find_one({"id": "app"}, {"_id": 0})


@api_router.put("/admin/settings")
async def admin_update_settings(body: dict, admin: dict = Depends(get_admin_user)):
    body.pop("id", None)
    await db.settings.update_one({"id": "app"}, {"$set": body})
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

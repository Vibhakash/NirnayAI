from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings
from app.database import get_db
from app.models import UserRole, doc_to_dict
from bson import ObjectId

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def authenticate_user(username: str, password: str) -> Optional[dict]:
    db = get_db()
    user = await db.users.find_one({"username": username})
    if not user or not verify_password(password, user["password_hash"]):
        return None
    return doc_to_dict(user)


async def get_user_by_id(user_id: str) -> Optional[dict]:
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return doc_to_dict(doc) if doc else None


async def create_user(username: str, email: str, password: str, role: UserRole, full_name: str) -> dict:
    db = get_db()
    existing = await db.users.find_one({"$or": [{"username": username}, {"email": email}]})
    if existing:
        raise ValueError("Username or email already exists")
    doc = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "password_hash": hash_password(password),
        "role": role.value,
        "is_active": True,
        "preferred_language": "en",
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


async def update_preferred_language(user_id: str, language: str) -> None:
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferred_language": language}}
    )

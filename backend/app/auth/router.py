from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.auth.service import authenticate_user, create_user, create_access_token, update_preferred_language
from app.auth.dependencies import get_current_user
from app.models import UserRole, AuditActionType
from app.audit.service import log_event

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", status_code=201)
async def register(
    req: RegisterRequest,
    request: Request,
):
    """Create a new user account (public endpoint — no auth required)."""
    try:
        user = await create_user(
            username=req.username,
            email=req.email,
            password=req.password,
            role=req.role,
            full_name=req.full_name,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    await log_event(
        action_type=AuditActionType.USER_REGISTERED,
        entity_type="user",
        entity_id=user["id"],
        description=f"New user '{req.username}' registered with role '{req.role.value}'",
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    await log_event(
        action_type=AuditActionType.USER_LOGIN,
        entity_type="user",
        entity_id=user["id"],
        user_id=user["id"],
        user_name=user.get("username"),
        user_role=user.get("role"),
        description=f"User '{user['username']}' logged in",
        ip_address=request.client.host if request and request.client else None,
    )
    return {"access_token": token, "token_type": "bearer", "user": {k: v for k, v in user.items() if k != "password_hash"}}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}


class LanguageUpdateRequest(BaseModel):
    language: str


@router.put("/me/language")
async def update_language(
    req: LanguageUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the user's preferred language (e.g. 'en', 'hi', 'kn')."""
    valid_langs = ["en", "hi", "kn"]
    if req.language not in valid_langs:
        raise HTTPException(status_code=400, detail=f"Language must be one of {valid_langs}")
    
    await update_preferred_language(current_user["id"], req.language)
    return {"message": "Language preference updated", "preferred_language": req.language}


@router.post("/seed-admin", status_code=201, include_in_schema=False)
async def seed_admin():
    """One-time endpoint to create the initial admin user. Disabled after first use."""
    from app.database import get_db
    db = get_db()
    if await db.users.count_documents({}) > 0:
        raise HTTPException(400, "Users already exist. Use /auth/register with admin credentials.")
    user = await create_user(
        username="officer",
        email="officer@nirnayai.gov.in",
        password="Officer@123",
        role=UserRole.PROCUREMENT_OFFICER,
        full_name="Procurement Officer",
    )
    return {"message": "Admin created. Change password immediately.", "user": user}

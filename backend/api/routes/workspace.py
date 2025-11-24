from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import asyncio

from backend.database import get_db
from backend.models.user import User
from backend.models.workspace import Workspace, WorkspaceType
from backend.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceInDB
from backend.services.auth_service import get_current_user
from pydantic import BaseModel
from typing import List, Optional

# --- Key Validation Service (Simplified) ---

class KeyValidationRequest(BaseModel):
    whop_api_key: str
    stripe_secret_key: Optional[str] = None
    bot_token: str
    workspace_type: WorkspaceType

class KeyValidationResult(BaseModel):
    key_name: str
    is_valid: bool
    error: str | None = None

async def validate_keys(request: KeyValidationRequest) -> List[KeyValidationResult]:
    results = []

    async def validate_whop():
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {request.whop_api_key}"}
                # A simple endpoint to check if the key is valid
                response = await client.get("https://api.whop.com/api/v2/me", headers=headers)
                if response.status_code == 200:
                    results.append(KeyValidationResult(key_name="whop_api_key", is_valid=True))
                else:
                    results.append(KeyValidationResult(key_name="whop_api_key", is_valid=False, error=f"Whop API returned status {response.status_code}"))
        except Exception as e:
            results.append(KeyValidationResult(key_name="whop_api_key", is_valid=False, error=str(e)))

    async def validate_stripe():
        # In a real app, you'd use the stripe library. Here we simulate a check.
        # import stripe
        # stripe.api_key = request.stripe_secret_key
        # try:
        #   stripe.Account.retrieve()
        #   ...
        # except stripe.error.AuthenticationError:
        #   ...
        if not request.stripe_secret_key or request.stripe_secret_key == "connected_via_oauth":
            # Assume valid if connected via OAuth (checked elsewhere)
            results.append(KeyValidationResult(key_name="stripe_secret_key", is_valid=True))
        elif request.stripe_secret_key.startswith("sk_live_") or request.stripe_secret_key.startswith("sk_test_"):
            results.append(KeyValidationResult(key_name="stripe_secret_key", is_valid=True))
        else:
            results.append(KeyValidationResult(key_name="stripe_secret_key", is_valid=False, error="Invalid Stripe key format. Must start with sk_live_ or sk_test_."))

    async def validate_bot():
        # This is highly platform-specific. We'll just check if the token is not empty.
        if request.bot_token:
            results.append(KeyValidationResult(key_name="bot_token", is_valid=True))
        else:
            results.append(KeyValidationResult(key_name="bot_token", is_valid=False, error="Bot token cannot be empty."))

    await asyncio.gather(validate_whop(), validate_stripe(), validate_bot())
    return results


from backend.services.activation_service import activate_discord_engine, ActivationError

# --- API Router ---

router = APIRouter()

@router.post("/activate")
async def activate_engine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(Workspace.creator_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found. Please create and save a workspace first.")

    if workspace.workspace_type != WorkspaceType.DISCORD:
        raise HTTPException(status_code=400, detail=f"Activation is currently only supported for Discord workspaces.")

    if not workspace.guild_id:
        raise HTTPException(status_code=400, detail="Discord Server ID (Guild ID) is required for activation.")

    try:
        result = await activate_discord_engine(
            bot_token=workspace.bot_token,
            guild_id=workspace.guild_id
        )
        return result
    except ActivationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


@router.post("/validate-keys", response_model=List[KeyValidationResult])
async def validate_workspace_keys(
    request: KeyValidationRequest,
    current_user: User = Depends(get_current_user)
):
    return await validate_keys(request)


@router.post("/", response_model=WorkspaceInDB, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_workspace = db.query(Workspace).filter(Workspace.creator_id == current_user.id).first()
    if db_workspace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace already exists for this user."
        )
    
    # Optional: Add key validation before creation
    # validation_results = await validate_keys(KeyValidationRequest(**workspace.dict()))
    # if not all(r.is_valid for r in validation_results):
    #     raise HTTPException(status_code=400, detail={"message": "Invalid API keys provided.", "details": validation_results})

    new_workspace = Workspace(**workspace.dict(), creator_id=current_user.id)
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    return new_workspace

@router.get("/", response_model=WorkspaceInDB)
def get_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = db.query(Workspace).filter(Workspace.creator_id == current_user.id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found for this user. Please create one."
        )
    return workspace

@router.put("/", response_model=WorkspaceInDB)
def update_workspace(
    workspace_update: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_workspace = db.query(Workspace).filter(Workspace.creator_id == current_user.id).first()
    if not db_workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found."
        )

    update_data = workspace_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_workspace, key, value)
    
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace
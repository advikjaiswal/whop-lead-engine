# import discord
import asyncio
from backend.models.workspace import Workspace
from sqlalchemy.orm import Session

class ActivationError(Exception):
    pass

async def activate_discord_engine(db: Session, workspace: Workspace):
    """
    Activates the Discord engine for a workspace.
    """
    print(f"Activating Discord engine for workspace {workspace.id}")
    
    if not workspace.bot_token:
        raise ActivationError("No bot token provided")
        
    # Mock implementation for stability/Python 3.13 compatibility
    print("Discord engine activation simulated (Discord disabled).")
    workspace.is_active = True
    db.add(workspace)
    db.commit()
    return {"status": "success", "message": "Engine activated successfully (SIMULATED)."}

    # Original implementation (disabled)
    # intents = discord.Intents.default()
    # intents.guilds = True
    # intents.messages = True
    # client = discord.Client(intents=intents)
    # ...


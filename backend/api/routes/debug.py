from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from backend.database import get_db, engine
import os

router = APIRouter()

@router.get("/db")
async def debug_db(db: Session = Depends(get_db)):
    results = {
        "database_url_configured": bool(os.getenv("DATABASE_URL")),
        "connection_successful": False,
        "tables": [],
        "users_table_exists": False,
        "error": None
    }
    
    try:
        # Test connection
        db.execute(text("SELECT 1"))
        results["connection_successful"] = True
        
        # Inspect tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        results["tables"] = tables
        results["users_table_exists"] = "users" in tables
        
    except Exception as e:
        results["error"] = str(e)
        
    return results

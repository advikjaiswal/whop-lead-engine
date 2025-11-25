from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models.user import User
from backend.models.lead import MessageFlow
from backend.schemas.message_flow import MessageFlowCreate, MessageFlowUpdate, MessageFlowInDB
from backend.services.auth_service import get_current_user

router = APIRouter()

@router.post("/", response_model=MessageFlowInDB, status_code=status.HTTP_201_CREATED)
def create_message_flow(
    flow: MessageFlowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_flow = MessageFlow(**flow.dict(), creator_id=current_user.id)
    db.add(new_flow)
    db.commit()
    db.refresh(new_flow)
    return new_flow

@router.get("/", response_model=List[MessageFlowInDB])
def get_message_flows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flows = db.query(MessageFlow).filter(MessageFlow.creator_id == current_user.id).all()
    return flows

@router.get("/{flow_id}", response_model=MessageFlowInDB)
def get_message_flow(
    flow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flow = db.query(MessageFlow).filter(MessageFlow.id == flow_id, MessageFlow.creator_id == current_user.id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Message flow not found.")
    return flow

@router.put("/{flow_id}", response_model=MessageFlowInDB)
def update_message_flow(
    flow_id: int,
    flow_update: MessageFlowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_flow = db.query(MessageFlow).filter(MessageFlow.id == flow_id, MessageFlow.creator_id == current_user.id).first()
    if not db_flow:
        raise HTTPException(status_code=404, detail="Message flow not found.")

    update_data = flow_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_flow, key, value)
    
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    return db_flow

@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message_flow(
    flow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_flow = db.query(MessageFlow).filter(MessageFlow.id == flow_id, MessageFlow.creator_id == current_user.id).first()
    if not db_flow:
        raise HTTPException(status_code=404, detail="Message flow not found.")
    
    db.delete(db_flow)
    db.commit()
    return

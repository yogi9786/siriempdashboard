from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BranchBase(BaseModel):
    code: str
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class BranchCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    city: str
    description: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool


class BranchResponse(BranchBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

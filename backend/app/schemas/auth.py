from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str
    branch_code: Optional[str] = "YELAHANKA"
    remember_me: Optional[bool] = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    username: str
    full_name: str
    manager_code: Optional[str] = None
    email: Optional[str] = None
    role: str
    user_type: Optional[str] = None
    branch_id: int
    branch_code: str
    branch_name: str


class ManagerProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: int
    branch_code: str
    branch_name: str
    username: str
    full_name: str
    manager_code: Optional[str] = None
    email: Optional[str] = None
    role: str
    is_active: bool


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


class ManagerPublicOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    username: str
    manager_code: Optional[str] = None
    email: Optional[str] = None
    branch_id: int
    branch_code: str


class BranchPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    managers: List[ManagerPublicOption] = []


# Backward-compatibility alias
AdminProfile = ManagerProfile


class MessageResponse(BaseModel):
    message: str
    success: bool = True

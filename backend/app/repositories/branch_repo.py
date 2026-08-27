from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.branch import Branch, Admin
from backend.app.repositories.base import BaseRepository


class BranchRepository(BaseRepository[Branch]):
    def __init__(self, db: Session):
        super().__init__(Branch, db)

    def get_by_code(self, code: str) -> Optional[Branch]:
        return self.db.query(Branch).filter(Branch.code == code.upper(), Branch.is_active == True).first()

    def get_all_active(self) -> List[Branch]:
        return self.db.query(Branch).filter(Branch.is_active == True).order_by(Branch.id).all()


class AdminRepository(BaseRepository[Admin]):
    def __init__(self, db: Session):
        super().__init__(Admin, db)

    def get_by_username(self, username: str) -> Optional[Admin]:
        return self.db.query(Admin).filter(Admin.username == username).first()

    def get_by_branch_and_username(self, branch_id: int, username: str) -> Optional[Admin]:
        return (
            self.db.query(Admin)
            .filter(Admin.branch_id == branch_id, Admin.username == username, Admin.is_active == True)
            .first()
        )

import sys
import os
from datetime import datetime, timezone, date

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.branch import Branch, User
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, SchemeRecord, EmployeeFormMedia, GoogleReview, AttireRecord
from backend.app.models.outdoor_marketing import (
    OutdoorMarketingArea,
    OutdoorMarketingCustomer,
    OutdoorMarketingScheme,
    OutdoorMarketingActivity,
)
from backend.app.models.audit import AuditLog


def seed_database():
    """Idempotently seed the 3 showroom branches (Yelahanka, Kolar, Udupi), their respective Managers, and all 57 employees."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Enforce Zero-DB Admin Principle: Purge any legacy super admin database rows
        db.query(User).filter(User.role == "SUPER_ADMIN").delete()
        db.commit()

        print("[SEED] Starting database seeding for 3 branches, 9 managers & 57 employees...")

        branches_data = [
            {
                "code": "YELAHANKA",
                "name": "Yelahanka",
                "city": "Bangalore",
                "address": "BB Road, Near Police Station, Yelahanka, Bangalore - 560064",
                "phone": "+91 80 2856 1122",
                "email": "yelahanka@sirisamruddhigold.com",
                "description": "Main Showroom Portal, Bangalore North",
                "is_active": True,
                "managers": [
                    {
                        "name": settings.MANAGER_1_NAME,
                        "username": settings.MANAGER_1_USERNAME,
                        "password": settings.MANAGER_1_PASSWORD,
                    },
                    {
                        "name": settings.MANAGER_2_NAME,
                        "username": settings.MANAGER_2_USERNAME,
                        "password": settings.MANAGER_2_PASSWORD,
                    },
                    {
                        "name": settings.MANAGER_3_NAME,
                        "username": settings.MANAGER_3_USERNAME,
                        "password": settings.MANAGER_3_PASSWORD,
                    },
                    {
                        "name": settings.MANAGER_4_NAME,
                        "username": settings.MANAGER_4_USERNAME,
                        "password": settings.MANAGER_4_PASSWORD,
                    },
                    {
                        "name": settings.MANAGER_5_NAME,
                        "username": settings.MANAGER_5_USERNAME,
                        "password": settings.MANAGER_5_PASSWORD,
                    },
                ],
                "employees": [
                    "THAGGELLAPPA",
                    "SHYLAJA B N",
                    "SUCHITHRA",
                    "SATISH ARKSALI",
                    "SANNIRAMMA",
                    "NANDINI BASAVARAJ",
                    "KANTHARAJU",
                    "TULASI",
                    "SANGEETHA M",
                    "BHEEMAMMA",
                    "SUNIL",
                    "CHITHRA B",
                    "PRASAD H R",
                    "YOGANANDAN S P",
                    "THEJU",
                    "S GOPI",
                    "DEVARAJU",
                    "HARIPRIYA P V",
                    "SHWETHA M V",
                    "SINCHANA S",
                    "VIDYASHREE",
                    "SINCHANA P",
                    "NAGINDRAPPA",
                    "MADHU",
                    "MAHESWHARI",
                ],
                "code_prefix": "EMP-YEL-",
            },
            {
                "code": "KOLAR",
                "name": "Kolar",
                "city": "Kolar",
                "address": "Court Road, Near Clock Tower, Kolar - 563101",
                "phone": "+91 81 5222 3344",
                "email": "kolar@sirisamruddhigold.com",
                "description": "Showroom Management Portal, Kolar District",
                "is_active": True,
                "managers": [
                    {
                        "name": settings.KOLAR_MANAGER_1_NAME,
                        "username": settings.KOLAR_MANAGER_1_USERNAME,
                        "password": settings.KOLAR_MANAGER_1_PASSWORD,
                    },
                    {
                        "name": settings.KOLAR_MANAGER_2_NAME,
                        "username": settings.KOLAR_MANAGER_2_USERNAME,
                        "password": settings.KOLAR_MANAGER_2_PASSWORD,
                    },
                    {
                        "name": settings.KOLAR_MANAGER_3_NAME,
                        "username": settings.KOLAR_MANAGER_3_USERNAME,
                        "password": settings.KOLAR_MANAGER_3_PASSWORD,
                    },
                ],
                "employees": [
                    "SHIVAKUMAR M K",
                    "DIVAKARA N",
                    "MANJUNATHA M M",
                    "KIRAN KUMAR S",
                    "SHASHANKA N",
                    "SANDEEP S",
                    "SHRIDHAR ACHARYA",
                    "KAVYA",
                    "N LEELAVATHI",
                    "GAJENDRA S",
                    "H MAHESH KUMAR",
                ],
                "code_prefix": "EMP-KOL-",
            },
            {
                "code": "UDUPI",
                "name": "Udupi",
                "city": "Udupi",
                "address": "Car Street, Near Krishna Matha, Udupi - 576101",
                "phone": "+91 82 0252 5566",
                "email": "udupi@sirisamruddhigold.com",
                "description": "Showroom Management Portal, Coastal Karnataka",
                "is_active": True,
                "managers": [
                    {
                        "name": settings.UDUPI_MANAGER_1_NAME,
                        "username": settings.UDUPI_MANAGER_1_USERNAME,
                        "password": settings.UDUPI_MANAGER_1_PASSWORD,
                    },
                    {
                        "name": settings.UDUPI_MANAGER_2_NAME,
                        "username": settings.UDUPI_MANAGER_2_USERNAME,
                        "password": settings.UDUPI_MANAGER_2_PASSWORD,
                    },
                ],
                "employees": [
                    "PRABHAKARA K",
                    "ASHWINI KUMARI N",
                    "RAKSHITH AMIN",
                    "KIRAN KUMAR",
                    "SANDHYA",
                    "CHAITHRA",
                    "LAVISHA",
                    "SWETHA R",
                    "VENKATESHA",
                    "SANDESH KINI",
                    "KAVYA H R",
                    "GAYATHRI",
                    "MANOJ IRANNA",
                    "KAVYASHRI N",
                    "NISARGA ULLAS KHARVI",
                    "BHAGYA B R",
                    "AKSHAYA",
                    "NIKIL",
                    "DILEEP",
                    "RAGHAVENDRA S",
                ],
                "code_prefix": "EMP-UDU-",
            },
        ]

        for b_data in branches_data:
            managers = b_data.pop("managers")
            emp_names = b_data.pop("employees")
            code_prefix = b_data.pop("code_prefix")

            branch = db.query(Branch).filter(Branch.code == b_data["code"]).first()
            if not branch:
                branch = Branch(**b_data)
                db.add(branch)
                db.commit()
                db.refresh(branch)
                print(f"  + Created branch: {branch.name} ({branch.code})")
            else:
                for k, v in b_data.items():
                    setattr(branch, k, v)
                db.commit()
                db.refresh(branch)
                print(f"  + Verified branch: {branch.name} ({branch.code})")

            # Seed managers for this branch
            first_manager_id = None
            for m_info in managers:
                if not m_info.get("username") or not m_info.get("password"):
                    continue

                m_username = m_info["username"].strip()
                fallback_email = f"{m_username.lower()}@sirisamruddhigold.com"
                user = db.query(User).filter(User.username == m_username).first()
                hashed_pwd = get_password_hash(m_info["password"])

                if not user:
                    user = User(
                        branch_id=branch.id,
                        username=m_username,
                        email=fallback_email,
                        full_name=m_info["name"].strip(),
                        hashed_password=hashed_pwd,
                        role="MANAGER",
                        is_active=True,
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    print(f"    - Created Manager: {user.full_name} (@{user.username}) for {branch.name}")
                else:
                    user.branch_id = branch.id
                    user.full_name = m_info["name"].strip()
                    user.username = m_username
                    user.hashed_password = hashed_pwd
                    if not user.email:
                        user.email = fallback_email
                    user.role = "MANAGER"
                    user.is_active = True
                    db.commit()
                    db.refresh(user)
                    print(f"    - Updated Manager: {user.full_name} (@{user.username}) for {branch.name}")

                if not first_manager_id:
                    first_manager_id = user.id

            # Seed employees for this branch
            for idx, emp_name in enumerate(emp_names, start=1):
                emp_code = f"{code_prefix}{idx:03d}"
                employee = db.query(Employee).filter(
                    Employee.branch_id == branch.id,
                    Employee.full_name == emp_name.strip(),
                ).first()

                if not employee:
                    # Also check by employee_code
                    employee = db.query(Employee).filter(
                        Employee.branch_id == branch.id,
                        Employee.employee_code == emp_code,
                    ).first()

                if not employee:
                    employee = Employee(
                        branch_id=branch.id,
                        manager_id=first_manager_id,
                        employee_code=emp_code,
                        full_name=emp_name.strip(),
                        phone="",
                        email=None,
                        designation="Sales Executive",
                        department="Sales & Showroom Operations",
                        date_of_joining=date.today(),
                        status="active",
                        is_outdoor_marketing_employee=False,
                        notes=f"Staff member for {branch.name} showroom.",
                    )
                    db.add(employee)
                    db.commit()
                    print(f"    * Created Employee [{emp_code}]: {emp_name} for {branch.name}")
                else:
                    employee.full_name = emp_name.strip()
                    employee.employee_code = emp_code
                    employee.status = "active"
                    employee.is_outdoor_marketing_employee = False
                    db.commit()
                    print(f"    * Verified Employee [{emp_code}]: {emp_name} for {branch.name}")

        print("[SUCCESS] Database seeding completed for all 3 branches, 9 managers, and 57 employees.")

    except Exception as e:
        print(f"[ERROR] Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

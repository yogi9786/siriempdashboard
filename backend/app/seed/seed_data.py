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


# Complete Employee Roster with exact company IDs from official reference sheet
BRANCHES_DATA = [
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
        "code_prefix": "EMP-YEL-",
        "employees": [
            {"id": 48, "name": "DILEEP H E", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 109, "name": "ADARSHA", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 129, "name": "BASAVARAJ BARADDI", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 134, "name": "MANJUNATH P S", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 8, "name": "SHYLAJA B N", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 22, "name": "SATISH ARKSALI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 25, "name": "SANNIRAMMA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 54, "name": "NANDINI BASAVARAJ", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 61, "name": "KANTHARAJU", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 68, "name": "TULASI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 94, "name": "BHEEMAMMA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 107, "name": "SUNIL", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 110, "name": "CHITHRA B", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 43, "name": "PRASAD H R", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 116, "name": "YOGANANDAN S P", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 132, "name": "THEJU", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 178, "name": "S GOPI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 179, "name": "DEVARAJU", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 183, "name": "HARIPRIYA P V", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 201, "name": "SHWETHA M V", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 200, "name": "SINCHANA S", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 202, "name": "VIDYASHREE", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 203, "name": "SINCHANA P", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 204, "name": "NAGINDRAPPA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 211, "name": "MADHU", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 213, "name": "MAHESWHARI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
        ],
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
        "code_prefix": "EMP-KOL-",
        "employees": [
            {"id": 77, "name": "PRADEEP KUMAR B N", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 78, "name": "SIVA R", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 80, "name": "SHIVAKUMAR M K", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 82, "name": "DIVAKARA N", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 84, "name": "MANJUNATHA M M", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 85, "name": "KIRAN KUMAR S", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 90, "name": "SHASHANKA N", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 72, "name": "SANDEEP S", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 182, "name": "N LEELAVATHI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 191, "name": "KALPANA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 198, "name": "PUNITRAJKUMAR R", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 199, "name": "SWATHI V", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 208, "name": "GAJENDRA S", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 209, "name": "H MAHESH KUMAR", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
        ],
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
        "code_prefix": "EMP-UDU-",
        "employees": [
            {"id": 37, "name": "SANDEEPA", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 217, "name": "PRITHVIRAJU B V", "designation": "Showroom Manager", "department": "Showroom Operations"},
            {"id": 118, "name": "ASHWINI KUMARI N", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 167, "name": "PRABHAKARA K", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 140, "name": "RAKSHITH AMIN", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 141, "name": "KIRAN KUMAR", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 144, "name": "SANDHYA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 143, "name": "CHAITHRA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 160, "name": "LAVISHA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 152, "name": "SWETHA R", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 150, "name": "VENKATESHA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 151, "name": "SANDESH KINI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 154, "name": "KAVYA H R", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 155, "name": "GAYATHRI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 158, "name": "MANOJ IRANNA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 165, "name": "KAVYASHRI N", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 163, "name": "NISARGA ULLAS KHARVI", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 147, "name": "BHAGYA B R", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 148, "name": "AKSHAYA", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 186, "name": "NIKIL", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 189, "name": "DILEEP", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
            {"id": 210, "name": "RAGHAVENDRA S", "designation": "Sales Executive", "department": "Sales & Showroom Operations"},
        ],
    },
]


def seed_database():
    """Idempotently seed the 3 showroom branches (Yelahanka, Kolar, Udupi), their respective Managers, and all 62 employees with exact company IDs."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Enforce Zero-DB Admin Principle: Purge any legacy super admin database rows
        db.query(User).filter(User.role == "SUPER_ADMIN").delete()
        db.commit()

        print("[SEED] Starting database seeding for 3 branches, 9 managers & 62 employees with verified IDs...")

        # Collect valid new employee IDs
        all_new_emp_ids = set()
        for b_data in BRANCHES_DATA:
            for emp_info in b_data["employees"]:
                all_new_emp_ids.add(emp_info["id"])

        for b_data in BRANCHES_DATA:
            managers = b_data["managers"]
            employees_list = b_data["employees"]
            code_prefix = b_data["code_prefix"]

            branch = db.query(Branch).filter(Branch.code == b_data["code"]).first()
            if not branch:
                branch = Branch(
                    code=b_data["code"],
                    name=b_data["name"],
                    city=b_data["city"],
                    address=b_data["address"],
                    phone=b_data["phone"],
                    email=b_data["email"],
                    description=b_data["description"],
                    is_active=b_data["is_active"],
                )
                db.add(branch)
                db.commit()
                db.refresh(branch)
                print(f"  + Created branch: {branch.name} ({branch.code})")
            else:
                branch.name = b_data["name"]
                branch.city = b_data["city"]
                branch.address = b_data["address"]
                branch.phone = b_data["phone"]
                branch.email = b_data["email"]
                branch.description = b_data["description"]
                branch.is_active = b_data["is_active"]
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

            # Seed employees for this branch with their exact ID and code
            for emp_item in employees_list:
                emp_id = emp_item["id"]
                emp_name = emp_item["name"].strip()
                emp_code = f"{code_prefix}{emp_id:03d}"
                designation = emp_item.get("designation", "Sales Executive")
                department = emp_item.get("department", "Sales & Showroom Operations")

                employee = db.query(Employee).filter(Employee.id == emp_id).first()
                if not employee:
                    employee = Employee(
                        id=emp_id,
                        branch_id=branch.id,
                        manager_id=first_manager_id,
                        employee_code=emp_code,
                        full_name=emp_name,
                        phone="",
                        email=None,
                        designation=designation,
                        department=department,
                        date_of_joining=date.today(),
                        status="active",
                        is_outdoor_marketing_employee=False,
                        notes=f"Staff member [{emp_code}] for {branch.name} showroom.",
                    )
                    db.add(employee)
                    db.commit()
                    print(f"    * Created Employee [{emp_id} | {emp_code}]: {emp_name} for {branch.name}")
                else:
                    employee.branch_id = branch.id
                    if not employee.manager_id:
                        employee.manager_id = first_manager_id
                    employee.full_name = emp_name
                    employee.employee_code = emp_code
                    employee.designation = designation
                    employee.department = department
                    employee.status = "active"
                    db.commit()
                    print(f"    * Updated Employee [{emp_id} | {emp_code}]: {emp_name} for {branch.name}")

        # Clean up any legacy employees not in the official 62 list
        legacy_employees = db.query(Employee).filter(~Employee.id.in_(all_new_emp_ids)).all()
        if legacy_employees:
            for leg in legacy_employees:
                print(f"  - Removing legacy employee record: ID {leg.id} - {leg.full_name} ({leg.employee_code})")
                db.delete(leg)
            db.commit()

        print("[SUCCESS] Database seeding completed successfully for all 3 branches, 9 managers, and 62 employees with verified IDs.")

    except Exception as e:
        print(f"[ERROR] Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

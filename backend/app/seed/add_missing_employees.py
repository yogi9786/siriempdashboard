import sys
import os
from datetime import date

# Ensure root is in sys.path
_current = os.path.dirname(os.path.abspath(__file__))
_root = os.path.abspath(os.path.join(_current, "../../../"))
if _root not in sys.path:
    sys.path.insert(0, _root)

from backend.app.core.database import SessionLocal
from backend.app.models.employee import Employee
from backend.app.models.branch import Branch


def sync_all_employees():
    db = SessionLocal()
    try:
        branches_by_code = {b.code: b.id for b in db.query(Branch).all()}
        print(f"[EMPLOYEE SYNC] Found branches: {branches_by_code}")

        missing_employees_data = [
            # Yelahanka (Branch 1)
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-001", "name": "ADARSHA", "designation": "Store Manager", "dept": "Showroom Management"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-002", "name": "DILEEP H E", "designation": "Assistant Manager", "dept": "Showroom Management"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-003", "name": "BASAVARAJ BARADDI", "designation": "Floor Manager", "dept": "Showroom Management"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-004", "name": "MANJUNATH P S", "designation": "Floor Manager", "dept": "Showroom Management"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-005", "name": "VIJAY SARATHY", "designation": "Operations Manager", "dept": "Showroom Management"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-006", "name": "GAGAN", "designation": "Assistant Manager", "dept": "Showroom Management"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-214", "name": "THAGGELLAPPA", "designation": "Sales Executive", "dept": "Sales & Showroom Operations"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-215", "name": "SUCHITHRA", "designation": "Sales Executive", "dept": "Sales & Showroom Operations"},
            {"branch_code": "YELAHANKA", "code": "EMP-YEL-216", "name": "SANGEETHA M", "designation": "Sales Executive", "dept": "Sales & Showroom Operations"},

            # Kolar (Branch 2)
            {"branch_code": "KOLAR", "code": "EMP-KOL-001", "name": "PRADEEP KUMAR B N", "designation": "Store Manager", "dept": "Showroom Management"},
            {"branch_code": "KOLAR", "code": "EMP-KOL-002", "name": "SIVA R", "designation": "Assistant Manager", "dept": "Showroom Management"},
            {"branch_code": "KOLAR", "code": "EMP-KOL-003", "name": "ASLAM PASHA A", "designation": "Floor Manager", "dept": "Showroom Management"},
            {"branch_code": "KOLAR", "code": "EMP-KOL-004", "name": "SHIVAKUMAR M K", "designation": "Showroom Manager", "dept": "Showroom Management"},
            {"branch_code": "KOLAR", "code": "EMP-KOL-217", "name": "SHRIDHAR ACHARYA", "designation": "Sales Executive", "dept": "Sales & Showroom Operations"},
            {"branch_code": "KOLAR", "code": "EMP-KOL-218", "name": "KAVYA", "designation": "Sales Executive", "dept": "Sales & Showroom Operations"},

            # Udupi (Branch 3)
            {"branch_code": "UDUPI", "code": "EMP-UDU-001", "name": "SANDEEPA", "designation": "Store Manager", "dept": "Showroom Management"},
            {"branch_code": "UDUPI", "code": "EMP-UDU-002", "name": "PRITHVIRAJ", "designation": "Showroom Manager", "dept": "Showroom Management"},
        ]

        added = 0
        for item in missing_employees_data:
            b_id = branches_by_code.get(item["branch_code"])
            if not b_id:
                print(f"  [!] Branch {item['branch_code']} not found, skipping {item['name']}")
                continue

            existing = db.query(Employee).filter(
                Employee.branch_id == b_id,
                (Employee.employee_code == item["code"]) | (Employee.full_name == item["name"])
            ).first()

            if not existing:
                emp = Employee(
                    branch_id=b_id,
                    employee_code=item["code"],
                    full_name=item["name"],
                    designation=item["designation"],
                    department=item["dept"],
                    status="active",
                    date_of_joining=date(2026, 1, 1),
                    is_outdoor_marketing_employee=False,
                )
                db.add(emp)
                added += 1
                print(f"  + Added: {item['name']} ({item['code']}) to {item['branch_code']}")
            else:
                existing.status = "active"
                if existing.designation != item["designation"] and "Manager" in item["designation"]:
                    existing.designation = item["designation"]
                print(f"  ✓ Verified active: {existing.full_name} ({existing.employee_code}) in {item['branch_code']}")

        db.commit()
        total_now = db.query(Employee).count()
        print(f"[EMPLOYEE SYNC] Completed! Added {added} employees. Total in database: {total_now}")
        return total_now
    finally:
        db.close()


if __name__ == "__main__":
    sync_all_employees()


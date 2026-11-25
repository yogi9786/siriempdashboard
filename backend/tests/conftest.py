import os
import sys
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_password_hash
from backend.app.models.branch import Branch, User
from backend.app.models.employee import Employee
from backend.app.seed.seed_data import BRANCHES_DATA

# Create test in-memory SQLite engine
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create schema in in-memory test database and seed 3 branches, managers, HR, and employees."""
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()
    try:
        # Seed 3 Branches
        b_yelahanka = Branch(
            code="YELAHANKA",
            name="Yelahanka",
            city="Bangalore",
            address="BB Road, Yelahanka",
            phone="+91 80 2856 1122",
            email="yelahanka@sirisamruddhigold.com",
            is_active=True,
        )
        b_kolar = Branch(
            code="KOLAR",
            name="Kolar",
            city="Kolar",
            address="Court Road, Kolar",
            phone="+91 81 5222 3344",
            email="kolar@sirisamruddhigold.com",
            is_active=True,
        )
        b_udupi = Branch(
            code="UDUPI",
            name="Udupi",
            city="Udupi",
            address="Car Street, Udupi",
            phone="+91 82 0252 5566",
            email="udupi@sirisamruddhigold.com",
            is_active=True,
        )
        db.add_all([b_yelahanka, b_kolar, b_udupi])
        db.commit()
        db.refresh(b_yelahanka)
        db.refresh(b_kolar)
        db.refresh(b_udupi)

        # Seed Managers for Yelahanka
        y_managers = [
            (settings.MANAGER_1_NAME, settings.MANAGER_1_USERNAME, settings.MANAGER_1_PASSWORD),
            (settings.MANAGER_2_NAME, settings.MANAGER_2_USERNAME, settings.MANAGER_2_PASSWORD),
            (settings.MANAGER_3_NAME, settings.MANAGER_3_USERNAME, settings.MANAGER_3_PASSWORD),
            (settings.MANAGER_4_NAME, settings.MANAGER_4_USERNAME, settings.MANAGER_4_PASSWORD),
            (settings.MANAGER_5_NAME, settings.MANAGER_5_USERNAME, settings.MANAGER_5_PASSWORD),
        ]
        for name, uname, pwd in y_managers:
            u = User(
                branch_id=b_yelahanka.id,
                email=f"{uname.lower()}@sirisamruddhigold.com",
                username=uname,
                full_name=name,
                hashed_password=get_password_hash(pwd),
                role="MANAGER",
                is_active=True,
            )
            db.add(u)

        # Seed Managers for Kolar
        k_managers = [
            (settings.KOLAR_MANAGER_1_NAME, settings.KOLAR_MANAGER_1_USERNAME, settings.KOLAR_MANAGER_1_PASSWORD),
            (settings.KOLAR_MANAGER_2_NAME, settings.KOLAR_MANAGER_2_USERNAME, settings.KOLAR_MANAGER_2_PASSWORD),
            (settings.KOLAR_MANAGER_3_NAME, settings.KOLAR_MANAGER_3_USERNAME, settings.KOLAR_MANAGER_3_PASSWORD),
        ]
        for name, uname, pwd in k_managers:
            u = User(
                branch_id=b_kolar.id,
                email=f"{uname.lower()}@sirisamruddhigold.com",
                username=uname,
                full_name=name,
                hashed_password=get_password_hash(pwd),
                role="MANAGER",
                is_active=True,
            )
            db.add(u)

        # Seed Managers for Udupi
        u_managers = [
            (settings.UDUPI_MANAGER_1_NAME, settings.UDUPI_MANAGER_1_USERNAME, settings.UDUPI_MANAGER_1_PASSWORD),
            (settings.UDUPI_MANAGER_2_NAME, settings.UDUPI_MANAGER_2_USERNAME, settings.UDUPI_MANAGER_2_PASSWORD),
        ]
        for name, uname, pwd in u_managers:
            u = User(
                branch_id=b_udupi.id,
                email=f"{uname.lower()}@sirisamruddhigold.com",
                username=uname,
                full_name=name,
                hashed_password=get_password_hash(pwd),
                role="MANAGER",
                is_active=True,
            )
            db.add(u)

        # Seed HR User
        hr_u = User(
            branch_id=b_yelahanka.id,
            email=f"{settings.HR_USERNAME}@sirisamruddhigold.com",
            username=settings.HR_USERNAME,
            full_name=settings.HR_NAME or "HR Manager",
            hashed_password=get_password_hash(settings.HR_PASSWORD),
            role="HR",
            is_active=True,
        )
        db.add(hr_u)

        # Seed Employees for each branch from verified BRANCHES_DATA roster
        for b_data in BRANCHES_DATA:
            b_code = b_data["code"].upper()
            target_branch = b_yelahanka if b_code == "YELAHANKA" else (b_kolar if b_code == "KOLAR" else b_udupi)
            code_prefix = b_data.get("code_prefix", "")

            for emp_item in b_data.get("employees", []):
                e_id = emp_item["id"]
                e_code = f"{code_prefix}{e_id:03d}"
                emp = Employee(
                    branch_id=target_branch.id,
                    employee_code=e_code,
                    full_name=emp_item["name"].strip(),
                    designation=emp_item.get("designation", "Sales Executive"),
                    department=emp_item.get("department", "Sales & Showroom Operations"),
                    date_of_joining=date.today(),
                    status="active",
                    is_outdoor_marketing_employee=False,
                    notes=f"Verified employee {e_code} for {target_branch.name}",
                )
                db.add(emp)

        db.commit()
    finally:
        db.close()

    # Override get_db in FastAPI app
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def manager_token(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={
            "branch_code": "YELAHANKA",
            "username": settings.MANAGER_1_USERNAME,
            "password": settings.MANAGER_1_PASSWORD,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def manager_auth_headers(manager_token) -> dict:
    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture
def kolar_manager_token(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={
            "branch_code": "KOLAR",
            "username": settings.KOLAR_MANAGER_1_USERNAME,
            "password": settings.KOLAR_MANAGER_1_PASSWORD,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def kolar_manager_auth_headers(kolar_manager_token) -> dict:
    return {"Authorization": f"Bearer {kolar_manager_token}"}


@pytest.fixture
def hr_token(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.HR_USERNAME,
            "password": settings.HR_PASSWORD,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def hr_auth_headers(hr_token) -> dict:
    return {"Authorization": f"Bearer {hr_token}"}


@pytest.fixture
def admin_token(client) -> str:
    response = client.post(
        "/api/v1/admin/auth/login",
        json={
            "username": settings.ADMIN_EMAIL,
            "password": settings.ADMIN_PASSWORD_HASH,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def admin_auth_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def employee_token(client) -> str:
    response = client.post(
        "/api/v1/auth/employee/login",
        json={
            "branch_code": "YELAHANKA",
            "username": "EMP-YEL-008",
            "password": "Shylaja@siri1234",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def employee_auth_headers(employee_token) -> dict:
    return {"Authorization": f"Bearer {employee_token}"}


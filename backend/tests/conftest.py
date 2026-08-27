import os
import sys
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
    """Create schema in in-memory test database and seed 3 branches & 9 managers."""
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
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def manager_auth_headers(manager_token) -> dict:
    return {"Authorization": f"Bearer {manager_token}"}

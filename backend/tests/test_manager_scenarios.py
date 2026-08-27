import io
import pytest
from backend.app.core.config import settings
from backend.app.core.security import create_access_token


# Scenario 1: Manager can log in with username
def test_scenario_01_manager_login_with_username(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.MANAGER_1_USERNAME,
            "password": settings.MANAGER_1_PASSWORD,
            "branch_code": "YELAHANKA",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "MANAGER"
    assert data["branch_code"] == "YELAHANKA"
    assert data["username"] == settings.MANAGER_1_USERNAME


# Scenario 2: Showroom branch manager credentials match .env
def test_scenario_02_manager_credentials_match_env():
    # Yelahanka 5
    assert settings.MANAGER_1_USERNAME
    assert settings.MANAGER_1_PASSWORD
    assert settings.MANAGER_2_USERNAME
    assert settings.MANAGER_2_PASSWORD
    assert settings.MANAGER_3_USERNAME
    assert settings.MANAGER_3_PASSWORD
    assert settings.MANAGER_4_USERNAME
    assert settings.MANAGER_4_PASSWORD
    assert settings.MANAGER_5_USERNAME
    assert settings.MANAGER_5_PASSWORD
    # Kolar 2
    assert settings.KOLAR_MANAGER_1_USERNAME
    assert settings.KOLAR_MANAGER_1_PASSWORD
    assert settings.KOLAR_MANAGER_2_USERNAME
    assert settings.KOLAR_MANAGER_2_PASSWORD
    # Udupi 2
    assert settings.UDUPI_MANAGER_1_USERNAME
    assert settings.UDUPI_MANAGER_1_PASSWORD
    assert settings.UDUPI_MANAGER_2_USERNAME
    assert settings.UDUPI_MANAGER_2_PASSWORD


# Scenario 3: Manager cannot log in with invalid password
def test_scenario_03_manager_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.MANAGER_1_USERNAME,
            "password": "IncorrectPassword123!",
            "branch_code": "YELAHANKA",
        },
    )
    assert response.status_code == 401
    assert "detail" in response.json()


# Scenario 4: Non-manager role / unauthorized token rejected
def test_scenario_04_non_manager_role_rejected(client):
    fake_token = create_access_token(
        subject=999,
        branch_id=1,
        branch_code="YELAHANKA",
        role="STAFF",
    )
    response = client.get(
        "/api/v1/dashboard/overview",
        headers={"Authorization": f"Bearer {fake_token}"},
    )
    assert response.status_code in (401, 403)


# Scenario 5: All 5 Yelahanka managers can log in
@pytest.mark.parametrize(
    "username,password",
    [
        (settings.MANAGER_1_USERNAME, settings.MANAGER_1_PASSWORD),
        (settings.MANAGER_2_USERNAME, settings.MANAGER_2_PASSWORD),
        (settings.MANAGER_3_USERNAME, settings.MANAGER_3_PASSWORD),
        (settings.MANAGER_4_USERNAME, settings.MANAGER_4_PASSWORD),
        (settings.MANAGER_5_USERNAME, settings.MANAGER_5_PASSWORD),
    ],
)
def test_scenario_05_all_yelahanka_managers_can_login(client, username, password):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password, "branch_code": "YELAHANKA"},
    )
    assert res.status_code == 200
    assert res.json()["branch_code"] == "YELAHANKA"


# Scenario 6: All Kolar and Udupi managers can log in
@pytest.mark.parametrize(
    "username,password,branch_code",
    [
        (settings.KOLAR_MANAGER_1_USERNAME, settings.KOLAR_MANAGER_1_PASSWORD, "KOLAR"),
        (settings.KOLAR_MANAGER_2_USERNAME, settings.KOLAR_MANAGER_2_PASSWORD, "KOLAR"),
        (settings.UDUPI_MANAGER_1_USERNAME, settings.UDUPI_MANAGER_1_PASSWORD, "UDUPI"),
        (settings.UDUPI_MANAGER_2_USERNAME, settings.UDUPI_MANAGER_2_PASSWORD, "UDUPI"),
    ],
)
def test_scenario_06_kolar_and_udupi_managers_can_login(client, username, password, branch_code):
    res = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password, "branch_code": branch_code},
    )
    assert res.status_code == 200
    assert res.json()["branch_code"] == branch_code


# Scenario 7: Showroom employee query returns list
def test_scenario_07_showroom_employee_query(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


# Scenario 8: Manager can add an employee
def test_scenario_08_manager_add_employee(client, manager_auth_headers):
    emp_payload = {
        "employee_code": "EMP-YEL-TEST-101",
        "full_name": "Deepak Rao",
        "phone": "9845099901",
        "email": "deepak.test@sirisamruddhigold.com",
        "designation": "Senior Sales Executive",
        "department": "Gold Jewellery",
        "date_of_joining": "2026-01-15",
        "status": "active",
        "is_outdoor_marketing_employee": True,
        "notes": "Experienced gold specialist",
    }
    response = client.post("/api/v1/employees", json=emp_payload, headers=manager_auth_headers)
    assert response.status_code == 201
    created = response.json()
    assert created["full_name"] == "Deepak Rao"
    assert created["employee_code"] == "EMP-YEL-TEST-101"
    assert created["is_outdoor_marketing_employee"] is True


# Scenario 9: Manager can edit an employee
def test_scenario_09_manager_edit_employee(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    employees = res.json()
    assert len(employees) > 0
    target_emp = employees[0]

    update_payload = {
        "full_name": target_emp["full_name"] + " Updated",
        "designation": "Lead Floor Consultant",
        "phone": target_emp["phone"],
    }
    response = client.put(
        f"/api/v1/employees/{target_emp['id']}",
        json=update_payload,
        headers=manager_auth_headers,
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["designation"] == "Lead Floor Consultant"


# Scenario 10: Manager can delete an employee
def test_scenario_10_manager_delete_employee(client, manager_auth_headers):
    create_res = client.post(
        "/api/v1/employees",
        json={
            "employee_code": "EMP-DEL-TEMP",
            "full_name": "To Be Deleted",
            "phone": "9876543210",
            "designation": "Temp",
            "department": "Gold Jewellery",
        },
        headers=manager_auth_headers,
    )
    assert create_res.status_code == 201
    emp_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/employees/{emp_id}", headers=manager_auth_headers)
    assert del_res.status_code == 200

    get_res = client.get(f"/api/v1/employees/{emp_id}", headers=manager_auth_headers)
    assert get_res.status_code == 404


# Scenario 11: Customers attended count increments correctly
def test_scenario_11_customers_attended_count(client, manager_auth_headers):
    emp_res = client.post(
        "/api/v1/employees",
        json={
            "employee_code": "EMP-ATT-001",
            "full_name": "Kiran Kumar",
            "phone": "9845011111",
            "designation": "Sales Consultant",
            "department": "Gold Jewellery",
        },
        headers=manager_auth_headers,
    )
    emp_id = emp_res.json()["id"]

    client.post(
        "/api/v1/customers",
        json={
            "employee_id": emp_id,
            "customer_name": "Cust A",
            "phone_number": "9000000001",
            "activity_date": "2026-08-25",
            "status": "Attended",
        },
        headers=manager_auth_headers,
    )
    client.post(
        "/api/v1/customers",
        json={
            "employee_id": emp_id,
            "customer_name": "Cust B",
            "phone_number": "9000000002",
            "activity_date": "2026-08-25",
            "status": "Attended",
        },
        headers=manager_auth_headers,
    )

    detail_res = client.get(f"/api/v1/employees/{emp_id}", headers=manager_auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["customers_attended_count"] == 2


# Scenario 12: Customers closed count increments correctly
def test_scenario_12_customers_closed_count(client, manager_auth_headers):
    emp_res = client.post(
        "/api/v1/employees",
        json={
            "employee_code": "EMP-CLS-002",
            "full_name": "Pooja Hegde",
            "phone": "9845022222",
            "designation": "Senior Consultant",
            "department": "Diamond Jewellery",
        },
        headers=manager_auth_headers,
    )
    emp_id = emp_res.json()["id"]

    client.post(
        "/api/v1/customers",
        json={
            "employee_id": emp_id,
            "customer_name": "Cust 1",
            "phone_number": "9111111111",
            "activity_date": "2026-08-25",
            "status": "Attended",
        },
        headers=manager_auth_headers,
    )
    client.post(
        "/api/v1/customers",
        json={
            "employee_id": emp_id,
            "customer_name": "Cust 2",
            "phone_number": "9222222222",
            "activity_date": "2026-08-25",
            "status": "Closed",
        },
        headers=manager_auth_headers,
    )

    detail_res = client.get(f"/api/v1/employees/{emp_id}", headers=manager_auth_headers)
    data = detail_res.json()
    assert data["customers_attended_count"] == 2
    assert data["customers_closed_count"] == 1


# Scenario 13: Schemes closed count increments correctly
def test_scenario_13_schemes_closed_count(client, manager_auth_headers):
    emp_res = client.post(
        "/api/v1/employees",
        json={
            "employee_code": "EMP-SCH-003",
            "full_name": "Manjunath",
            "phone": "9845033333",
            "designation": "Executive",
            "department": "Customer Relations",
        },
        headers=manager_auth_headers,
    )
    emp_id = emp_res.json()["id"]

    client.post(
        "/api/v1/schemes",
        json={
            "employee_id": emp_id,
            "customer_name": "Scheme Cust 1",
            "scheme_name": "Gold Saver Plan",
            "amount": 5000,
            "record_date": "2026-08-25",
        },
        headers=manager_auth_headers,
    )
    client.post(
        "/api/v1/schemes",
        json={
            "employee_id": emp_id,
            "customer_name": "Scheme Cust 2",
            "scheme_name": "Gold Super Saver",
            "amount": 10000,
            "record_date": "2026-08-25",
        },
        headers=manager_auth_headers,
    )

    detail_res = client.get(f"/api/v1/employees/{emp_id}", headers=manager_auth_headers)
    assert detail_res.json()["schemes_closed_count"] == 2


# Scenario 14: Manager can upload form image
def test_scenario_14_manager_upload_form_image(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    emp_id = res.json()[0]["id"]

    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00")
    files = {"file": ("form_test.jpg", fake_image, "image/jpeg")}
    data = {"employee_id": emp_id, "form_type": "Daily Submission Form", "notes": "Test form upload"}

    upload_res = client.post(
        "/api/v1/forms/upload",
        data=data,
        files=files,
        headers=manager_auth_headers,
    )
    assert upload_res.status_code == 201
    media = upload_res.json()
    assert media["form_type"] == "Daily Submission Form"
    assert "/media/" in media["file_url"]


# Scenario 15: Form image rejected if MIME type is invalid
def test_scenario_15_form_image_invalid_mime(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    emp_id = res.json()[0]["id"]

    fake_text_file = io.BytesIO(b"Hello this is not an image file.")
    files = {"file": ("document.txt", fake_text_file, "text/plain")}
    data = {"employee_id": emp_id, "form_type": "Daily Submission Form"}

    upload_res = client.post(
        "/api/v1/forms/upload",
        data=data,
        files=files,
        headers=manager_auth_headers,
    )
    assert upload_res.status_code == 400
    assert "Invalid file type" in upload_res.json()["detail"]


# Scenario 16: Form image rejected if file size exceeds limit (>10MB)
def test_scenario_16_form_image_oversized(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    emp_id = res.json()[0]["id"]

    large_data = b"x" * (11 * 1024 * 1024)
    fake_large_image = io.BytesIO(large_data)
    files = {"file": ("large_photo.jpg", fake_large_image, "image/jpeg")}
    data = {"employee_id": emp_id, "form_type": "Daily Submission Form"}

    upload_res = client.post(
        "/api/v1/forms/upload",
        data=data,
        files=files,
        headers=manager_auth_headers,
    )
    assert upload_res.status_code in (400, 413)
    assert "exceeds" in upload_res.json()["detail"].lower()


# Scenario 17: Manager can record a Google review
def test_scenario_17_manager_record_google_review(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    emp_id = res.json()[0]["id"]

    review_payload = {
        "customer_name": "Vani Sharma",
        "review_date": "2026-08-25",
        "rating": 5,
        "review_text": "Exceptional customer experience at Yelahanka showroom! Loved the bridal gold collection.",
        "employee_id": emp_id,
        "notes": "Verified Google Maps review",
        "status": "Published",
    }
    response = client.post(
        "/api/v1/google-reviews",
        json=review_payload,
        headers=manager_auth_headers,
    )
    assert response.status_code == 201
    review = response.json()
    assert review["customer_name"] == "Vani Sharma"
    assert review["rating"] == 5


# Scenario 18: Manager can log attire compliance
def test_scenario_18_manager_log_attire_compliance(client, manager_auth_headers):
    res = client.get("/api/v1/employees", headers=manager_auth_headers)
    emp_id = res.json()[0]["id"]

    attire_payload = {
        "employee_id": emp_id,
        "check_date": "2026-08-25",
        "status": "Proper",
        "notes": "Full uniform, identity badge, proper grooming verified.",
    }
    response = client.post(
        "/api/v1/attire",
        json=attire_payload,
        headers=manager_auth_headers,
    )
    assert response.status_code == 201
    record = response.json()
    assert record["status"] == "Proper"
    assert record["employee_id"] == emp_id


# Scenario 19: All 3 showroom branches and their managers are available via public API
def test_scenario_19_get_all_branches_with_managers(client):
    res = client.get("/api/v1/auth/branches")
    assert res.status_code == 200
    branches = res.json()
    assert len(branches) == 3
    branch_codes = [b["code"] for b in branches]
    assert "YELAHANKA" in branch_codes
    assert "KOLAR" in branch_codes
    assert "UDUPI" in branch_codes

    # Verify Yelahanka has 5 managers
    yel = next(b for b in branches if b["code"] == "YELAHANKA")
    assert len(yel["managers"]) == 5

    # Verify Kolar has 3 managers
    kol = next(b for b in branches if b["code"] == "KOLAR")
    assert len(kol["managers"]) == 3

    # Verify Udupi has 2 managers
    udu = next(b for b in branches if b["code"] == "UDUPI")
    assert len(udu["managers"]) == 2


# Scenario 20: Kolar manager can log in
def test_scenario_20_kolar_manager_login(client):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.KOLAR_MANAGER_1_USERNAME,
            "password": settings.KOLAR_MANAGER_1_PASSWORD,
            "branch_code": "KOLAR",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["branch_code"] == "KOLAR"
    assert data["role"] == "MANAGER"


# Scenario 21: Udupi manager can log in
def test_scenario_21_udupi_manager_login(client):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.UDUPI_MANAGER_1_USERNAME,
            "password": settings.UDUPI_MANAGER_1_PASSWORD,
            "branch_code": "UDUPI",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["branch_code"] == "UDUPI"
    assert data["role"] == "MANAGER"


# Scenario 22: Showroom Branch-Level Employee Isolation (Branch managers see their branch's employees, other branches cannot)
def test_scenario_22_branch_employee_isolation(client):
    # 1. Login as Yelahanka Manager 1
    res_y1 = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.MANAGER_1_USERNAME,
            "password": settings.MANAGER_1_PASSWORD,
            "branch_code": "YELAHANKA",
        },
    )
    token_y1 = res_y1.json()["access_token"]
    headers_y1 = {"Authorization": f"Bearer {token_y1}"}

    # 2. Login as Yelahanka Manager 2
    res_y2 = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.MANAGER_2_USERNAME,
            "password": settings.MANAGER_2_PASSWORD,
            "branch_code": "YELAHANKA",
        },
    )
    token_y2 = res_y2.json()["access_token"]
    headers_y2 = {"Authorization": f"Bearer {token_y2}"}

    # 3. Login as Kolar Manager 1
    res_k1 = client.post(
        "/api/v1/auth/login",
        json={
            "username": settings.KOLAR_MANAGER_1_USERNAME,
            "password": settings.KOLAR_MANAGER_1_PASSWORD,
            "branch_code": "KOLAR",
        },
    )
    token_k1 = res_k1.json()["access_token"]
    headers_k1 = {"Authorization": f"Bearer {token_k1}"}

    # 4. Yelahanka Manager 1 creates Employee X in Yelahanka
    create_res = client.post(
        "/api/v1/employees",
        json={
            "employee_code": "EMP-YEL-ISOL-01",
            "full_name": "Yelahanka Team Member",
            "phone": "9998887771",
            "designation": "Sales Specialist",
            "department": "Gold Department",
        },
        headers=headers_y1,
    )
    assert create_res.status_code == 201
    emp_y1_id = create_res.json()["id"]

    # 5. Yelahanka Manager 2 lists employees - MUST contain Employee X (same showroom branch)
    y2_list = client.get("/api/v1/employees", headers=headers_y2)
    assert y2_list.status_code == 200
    y2_employee_ids = [e["id"] for e in y2_list.json()]
    assert emp_y1_id in y2_employee_ids

    # 6. Kolar Manager 1 lists employees - MUST NOT contain Employee X (different branch)
    k1_list = client.get("/api/v1/employees", headers=headers_k1)
    assert k1_list.status_code == 200
    k1_employee_ids = [e["id"] for e in k1_list.json()]
    assert emp_y1_id not in k1_employee_ids

    # 7. Kolar Manager 1 cannot access Employee X directly (404)
    k1_get = client.get(f"/api/v1/employees/{emp_y1_id}", headers=headers_k1)
    assert k1_get.status_code == 404

    # 8. Kolar Manager 1 cannot update Employee X
    k1_put = client.put(
        f"/api/v1/employees/{emp_y1_id}",
        json={"full_name": "Cross Branch Attempt"},
        headers=headers_k1,
    )
    assert k1_put.status_code == 404

    # 9. Kolar Manager 1 cannot delete Employee X
    k1_del = client.delete(f"/api/v1/employees/{emp_y1_id}", headers=headers_k1)
    assert k1_del.status_code == 404

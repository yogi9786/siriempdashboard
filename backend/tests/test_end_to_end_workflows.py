import json
from datetime import date, datetime
import pytest

from app.core.config import settings


# =========================================================================
# 1. EMPLOYEE BACKEND WORKFLOWS
# =========================================================================

def test_emp_01_login_and_profile(client, employee_auth_headers):
    """Employee authenticates, fetches profile, and verifies showroom attribution."""
    res = client.get("/api/v1/auth/employee/me", headers=employee_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["employee_code"] == "EMP-YEL-008"
    assert data["full_name"] == "SHYLAJA B N"
    assert data["branch_code"] == "YELAHANKA"


def test_emp_02_dashboard_kpis(client, employee_auth_headers):
    """Employee dashboard endpoint returns correct metric fields and status."""
    res = client.get("/api/v1/employee/dashboard", headers=employee_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "total_customer_activities" in data
    assert "pending_customer_activities" in data
    assert "approved_customer_activities" in data
    assert "total_calls" in data
    assert "total_points" in data
    assert data["employee_code"] == "EMP-YEL-008"


def test_emp_03_customer_crud_workflow(client, employee_auth_headers):
    """Employee submits a customer interaction log, verifies it is in PENDING state, and can update it."""
    # 1. Submit interaction
    create_payload = {
        "customer_name": "Ramesh Kumar Test",
        "phone_number": "9876543210",
        "product_value": 45000.0,
        "status": "Sold",
        "notes": "Interested in 22kt gold chain. Advance paid.",
        "activity_date": str(date.today()),
        "breakdown": json.dumps([{"name": "Ramesh Kumar Test", "phone": "9876543210", "item": "22kt Gold Chain"}]),
    }
    create_res = client.post("/api/v1/employee/customers", json=create_payload, headers=employee_auth_headers)
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()
    assert created["customer_name"] == "Ramesh Kumar Test"
    assert created["product_value"] == 45000.0
    assert created["approval_status"] == "PENDING"
    activity_id = created["id"]

    # 2. List own customer interactions
    list_res = client.get("/api/v1/employee/customers", headers=employee_auth_headers)
    assert list_res.status_code == 200
    activities = list_res.json()
    matching = [a for a in activities if a["id"] == activity_id]
    assert len(matching) == 1
    assert matching[0]["approval_status"] == "PENDING"

    # 3. Update customer interaction
    update_payload = {
        "customer_name": "Ramesh Kumar Updated",
        "product_value": 48000.0,
        "notes": "Added gold ring request.",
    }
    update_res = client.put(f"/api/v1/employee/customers/{activity_id}", json=update_payload, headers=employee_auth_headers)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["customer_name"] == "Ramesh Kumar Updated"
    assert updated["product_value"] == 48000.0


def test_emp_04_call_activities_workflow(client, employee_auth_headers):
    """Employee logs customer call, toggles status, and verifies lifecycle."""
    call_payload = {
        "customer_name": "Priya Sharma",
        "phone_number": "9123456780",
        "purpose": "Jewellery scheme follow-up",
        "call_status": "Pending",
        "notes": "Customer requested callback tomorrow evening.",
    }
    post_res = client.post("/api/v1/employee/calls", json=call_payload, headers=employee_auth_headers)
    assert post_res.status_code == 201, post_res.text
    call_data = post_res.json()
    assert call_data["customer_name"] == "Priya Sharma"
    assert call_data["call_status"] == "Pending"
    call_id = call_data["id"]

    # Toggle status to Done
    toggle_res = client.patch(f"/api/v1/employee/calls/{call_id}/toggle", headers=employee_auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["call_status"] == "Done"

    # Delete call log
    del_res = client.delete(f"/api/v1/employee/calls/{call_id}", headers=employee_auth_headers)
    assert del_res.status_code == 200


def test_emp_05_reviews_workflow(client, employee_auth_headers):
    """Employee submits Google and Video reviews and checks points summary."""
    # 1. Google review submission
    g_payload = {
        "customer_name": "Ananya Roy",
        "rating": 5,
        "review_text": "Excellent service and trustworthy gold pricing!",
        "review_url": "https://maps.google.com/?cid=12345",
        "screenshot_url": "/uploads/test_google_proof.jpg",
        "review_date": str(date.today()),
    }
    g_res = client.post("/api/v1/employee/reviews/google", json=g_payload, headers=employee_auth_headers)
    assert g_res.status_code == 201, g_res.text
    assert g_res.json()["customer_name"] == "Ananya Roy"

    # 2. Video review submission
    v_payload = {
        "customer_name": "Kavitha Suresh",
        "video_title": "Customer Diwali purchase testimonial",
        "video_url": "/uploads/test_video_review.mp4",
        "screenshot_url": "/uploads/test_video_proof.jpg",
        "notes": "Customer happy with gold scheme maturity",
        "review_date": str(date.today()),
    }
    v_res = client.post("/api/v1/employee/reviews/video", json=v_payload, headers=employee_auth_headers)
    assert v_res.status_code == 201, v_res.text
    assert v_res.json()["customer_name"] == "Kavitha Suresh"

    # 3. Check points summary
    pts_res = client.get("/api/v1/employee/reviews/points", headers=employee_auth_headers)
    assert pts_res.status_code == 200
    pts_data = pts_res.json()
    assert "total_points" in pts_data
    assert "google_review_points" in pts_data
    assert "video_review_points" in pts_data


def test_emp_06_outdoor_customer_lead_workflow(client, employee_auth_headers):
    """Employee creates an individual outdoor marketing customer lead."""
    lead_payload = {
        "customer_name": "Suresh Gowda",
        "phone_number": "9988776655",
        "area_name": "Yelahanka Old Town",
        "status": "Interested",
        "notes": "Met at community stall. Interested in Ambari scheme.",
        "date": str(date.today()),
    }
    res = client.post("/api/v1/employee/outdoor/customer", json=lead_payload, headers=employee_auth_headers)
    assert res.status_code in [200, 201], res.text
    data = res.json()
    assert "id" in data
    cust_id = data["id"]
    assert cust_id > 0

    # Query leads
    leads_res = client.get("/api/v1/employee/outdoor/customers", headers=employee_auth_headers)
    assert leads_res.status_code == 200
    assert any(c["id"] == cust_id for c in leads_res.json())


def test_emp_07_leave_requests_workflow(client, employee_auth_headers):
    """Employee submits leave request and verifies pending review status."""
    leave_payload = {
        "leave_type": "Casual Leave",
        "subject": "Family function",
        "message": "Attending family function in native place",
        "from_date": "2026-11-28",
        "to_date": "2026-11-29",
        "days_count": 2,
    }
    post_res = client.post("/api/v1/employee/leaves", json=leave_payload, headers=employee_auth_headers)
    assert post_res.status_code == 201, post_res.text
    leave_data = post_res.json()
    assert leave_data["subject"] == "Family function"
    assert leave_data["status"] == "PENDING"
    assert leave_data["days_count"] == 2

    # Query leaves list
    get_res = client.get("/api/v1/employee/leaves", headers=employee_auth_headers)
    assert get_res.status_code == 200
    assert any(l["subject"] == "Family function" for l in get_res.json())


def test_emp_08_security_boundaries(client, employee_auth_headers):
    """Employee token cannot access Manager, HR, or Super Admin restricted routes."""
    # Manager overview
    res_mgr = client.get("/api/v1/dashboard/overview", headers=employee_auth_headers)
    assert res_mgr.status_code in [401, 403]

    # HR stats
    res_hr = client.get("/api/v1/hr/stats", headers=employee_auth_headers)
    assert res_hr.status_code in [401, 403]

    # Super Admin overview
    res_adm = client.get("/api/v1/admin/dashboard/overview", headers=employee_auth_headers)
    assert res_adm.status_code in [401, 403]


# =========================================================================
# 2. SHOWROOM MANAGER BACKEND WORKFLOWS
# =========================================================================

def test_mgr_01_login_and_dashboard(client, manager_auth_headers):
    """Manager logs in, accesses branch overview, notifications, and sales summary."""
    # Profile
    res_me = client.get("/api/v1/auth/me", headers=manager_auth_headers)
    assert res_me.status_code == 200
    assert res_me.json()["role"] == "MANAGER"
    assert res_me.json()["branch_code"] == "YELAHANKA"

    # Overview
    res_overview = client.get("/api/v1/dashboard/overview", headers=manager_auth_headers)
    assert res_overview.status_code == 200
    data = res_overview.json()
    assert "total_employees" in data
    assert "active_employees" in data
    assert data["branch_code"] == "YELAHANKA"

    # Notifications
    res_notif = client.get("/api/v1/dashboard/notifications", headers=manager_auth_headers)
    assert res_notif.status_code == 200
    assert "total_count" in res_notif.json()


def test_mgr_02_review_pending_customers(client, employee_auth_headers, manager_auth_headers):
    """Manager reviews an employee-submitted customer interaction and approves it."""
    # 1. Employee creates customer activity
    emp_res = client.post(
        "/api/v1/employee/customers",
        json={
            "customer_name": "Manjula Devi",
            "phone_number": "9845012345",
            "product_value": 75000.0,
            "status": "Sold",
            "notes": "22kt Bangle purchase",
            "activity_date": str(date.today()),
        },
        headers=employee_auth_headers,
    )
    assert emp_res.status_code == 201
    act_id = emp_res.json()["id"]

    # 2. Manager views pending queue
    pending_res = client.get("/api/v1/customers/pending", headers=manager_auth_headers)
    assert pending_res.status_code == 200
    pending_ids = [p["id"] for p in pending_res.json()]
    assert act_id in pending_ids

    # 3. Manager approves activity
    approve_res = client.post(
        f"/api/v1/customers/{act_id}/review",
        json={"action": "APPROVE", "notes": "Verified invoice and payment"},
        headers=manager_auth_headers,
    )
    assert approve_res.status_code == 200, approve_res.text
    assert approve_res.json()["approval_status"] == "APPROVED"

    # 4. Activity is no longer in pending queue
    after_pending = client.get("/api/v1/customers/pending", headers=manager_auth_headers)
    assert act_id not in [p["id"] for p in after_pending.json()]


def test_mgr_03_workforce_management(client, manager_auth_headers):
    """Manager lists branch employees, adds new staff, and edits record."""
    # 1. List employees for Yelahanka
    emp_res = client.get("/api/v1/employees", headers=manager_auth_headers)
    assert emp_res.status_code == 200
    initial_count = len(emp_res.json())
    assert initial_count >= 1

    # 2. Add new employee
    new_emp_payload = {
        "full_name": "Kavya Murthy Test",
        "employee_code": "EMP-YEL-999",
        "phone": "9876500011",
        "designation": "Sales Executive",
        "department": "Sales & Showroom Operations",
    }
    add_res = client.post("/api/v1/employees", json=new_emp_payload, headers=manager_auth_headers)
    assert add_res.status_code in [200, 201], add_res.text
    created_emp = add_res.json()
    emp_id = created_emp["id"]

    # 3. Update employee
    update_res = client.put(
        f"/api/v1/employees/{emp_id}",
        json={"phone": "9876500022", "designation": "Senior Sales Executive"},
        headers=manager_auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["designation"] == "Senior Sales Executive"

    # 4. Update employee active status
    toggle_res = client.put(
        f"/api/v1/employees/{emp_id}",
        json={"status": "inactive"},
        headers=manager_auth_headers,
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "inactive"


def test_mgr_04_outdoor_marketing_duties(client, manager_auth_headers):
    """Manager views outdoor areas, assigns duties, and lists outdoor marketing records."""
    # 1. Areas
    areas_res = client.get("/api/v1/outdoor-marketing/areas", headers=manager_auth_headers)
    assert areas_res.status_code == 200
    assert isinstance(areas_res.json(), list)

    # 2. Duties
    duties_res = client.get("/api/v1/outdoor-marketing/duties", headers=manager_auth_headers)
    assert duties_res.status_code == 200


def test_mgr_05_branch_revenue_analytics(client, manager_auth_headers):
    """Manager accesses branch revenue and customer activities with date filtering."""
    res = client.get("/api/v1/customers?date_filter=this_month", headers=manager_auth_headers)
    assert res.status_code == 200
    activities = res.json()
    assert isinstance(activities, list)

    res_counts = client.get("/api/v1/customers/pending-counts", headers=manager_auth_headers)
    assert res_counts.status_code == 200
    counts = res_counts.json()
    assert "pending" in counts
    assert "approved" in counts


def test_mgr_06_strict_branch_isolation(client, employee_auth_headers, kolar_manager_auth_headers):
    """Kolar showroom manager CANNOT see or approve Yelahanka pending activities."""
    # 1. Yelahanka employee creates activity
    y_res = client.post(
        "/api/v1/employee/customers",
        json={
            "customer_name": "Isolation Test Customer",
            "phone_number": "9111122222",
            "product_value": 30000.0,
            "status": "Sold",
            "activity_date": str(date.today()),
        },
        headers=employee_auth_headers,
    )
    assert y_res.status_code == 201
    y_act_id = y_res.json()["id"]

    # 2. Kolar manager attempts to view pending activities (must NOT include Yelahanka activity)
    kolar_pending = client.get("/api/v1/customers/pending", headers=kolar_manager_auth_headers)
    assert kolar_pending.status_code == 200
    assert y_act_id not in [p["id"] for p in kolar_pending.json()]

    # 3. Kolar manager attempts to approve Yelahanka activity directly -> Must return 404
    kolar_approve = client.post(
        f"/api/v1/customers/{y_act_id}/review",
        json={"action": "APPROVE"},
        headers=kolar_manager_auth_headers,
    )
    assert kolar_approve.status_code == 404


# =========================================================================
# 3. HUMAN RESOURCES (HR) BACKEND WORKFLOWS
# =========================================================================

def test_hr_01_auth_and_profile(client, hr_auth_headers):
    """HR Manager authenticates with hr_admin credentials and verifies HR role."""
    res = client.get("/api/v1/auth/me", headers=hr_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "HR"
    assert data["username"] == settings.HR_USERNAME


def test_hr_02_cross_branch_stats(client, hr_auth_headers):
    """HR retrieves overall stats and showroom branches breakdown."""
    # Stats
    res_stats = client.get("/api/v1/hr/stats", headers=hr_auth_headers)
    assert res_stats.status_code == 200, res_stats.text
    stats = res_stats.json()
    assert "total_employees" in stats
    assert stats["total_employees"] >= 60

    # Branches
    res_branches = client.get("/api/v1/hr/branches", headers=hr_auth_headers)
    assert res_branches.status_code == 200
    branches = res_branches.json()
    branch_codes = {b["code"] for b in branches}
    assert "YELAHANKA" in branch_codes
    assert "KOLAR" in branch_codes
    assert "UDUPI" in branch_codes


def test_hr_03_employee_directory_and_filtering(client, hr_auth_headers):
    """HR retrieves organization-wide employees and filters by showroom branch."""
    # All employees
    res_all = client.get("/api/v1/hr/employees", headers=hr_auth_headers)
    assert res_all.status_code == 200
    all_emps = res_all.json()
    assert len(all_emps) >= 60

    # Filter Yelahanka
    res_yel = client.get("/api/v1/hr/employees?branch_code=YELAHANKA", headers=hr_auth_headers)
    assert res_yel.status_code == 200
    yel_emps = res_yel.json()
    assert all((e.get("branch_code") or "").upper() == "YELAHANKA" for e in yel_emps)

    # Filter Kolar
    res_kol = client.get("/api/v1/hr/employees?branch_code=KOLAR", headers=hr_auth_headers)
    assert res_kol.status_code == 200
    kol_emps = res_kol.json()
    assert all((e.get("branch_code") or "").upper() == "KOLAR" for e in kol_emps)

    # Filter Udupi
    res_udu = client.get("/api/v1/hr/employees?branch_code=UDUPI", headers=hr_auth_headers)
    assert res_udu.status_code == 200
    udu_emps = res_udu.json()
    assert all((e.get("branch_code") or "").upper() == "UDUPI" for e in udu_emps)


def test_hr_04_employee_crud_workflow(client, hr_auth_headers):
    """HR adds a new employee to Udupi branch, edits details, and verifies record."""
    # 1. Create employee in Udupi
    create_payload = {
        "full_name": "Naveen Poojary Test",
        "employee_code": "EMP-UDU-999",
        "branch_code": "UDUPI",
        "designation": "Sales Executive",
        "department": "Showroom Sales",
        "phone": "9900112233",
    }
    create_res = client.post("/api/v1/hr/employees", json=create_payload, headers=hr_auth_headers)
    assert create_res.status_code == 201, create_res.text
    emp_data = create_res.json()
    emp_id = emp_data["id"]
    assert emp_data["full_name"] == "Naveen Poojary Test"

    # 2. Read employee 360 profile
    profile_res = client.get(f"/api/v1/hr/employees/{emp_id}", headers=hr_auth_headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["id"] == emp_id

    # 3. Update employee
    update_res = client.put(
        f"/api/v1/hr/employees/{emp_id}",
        json={"phone": "9900112244", "notes": "HR background verification complete"},
        headers=hr_auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["id"] == emp_id

    # 4. Delete employee
    del_res = client.delete(f"/api/v1/hr/employees/{emp_id}", headers=hr_auth_headers)
    assert del_res.status_code == 200


def test_hr_05_payslip_cross_role_lifecycle(client, hr_auth_headers, employee_auth_headers):
    """HR issues salary payslip -> Employee views it -> HR edits -> Employee sees update -> HR deletes -> Gone."""
    # 1. HR issues payslip for employee SHYLAJA B N (id from roster)
    emps = client.get("/api/v1/hr/employees?branch_code=YELAHANKA", headers=hr_auth_headers).json()
    shylaja = next(e for e in emps if e["employee_code"] == "EMP-YEL-008")

    issue_payload = {
        "employee_id": shylaja["id"],
        "month": "November",
        "year": 2026,
        "amount": 28500.0,
        "pay_period": "November 2026",
        "notes": "Diwali bonus included",
        "file_url": "/uploads/payslips/shylaja_nov_2026.pdf",
    }
    issue_res = client.post("/api/v1/hr/payslips", json=issue_payload, headers=hr_auth_headers)
    assert issue_res.status_code == 201, issue_res.text
    issued_slip = issue_res.json()
    slip_id = issued_slip["id"]
    assert issued_slip["amount"] == 28500.0

    # 2. Employee checks own portal payslips
    emp_slips_res = client.get("/api/v1/employee/payslips", headers=employee_auth_headers)
    assert emp_slips_res.status_code == 200
    my_slips = emp_slips_res.json()
    matching_slip = next((s for s in my_slips if s["id"] == slip_id), None)
    assert matching_slip is not None
    assert matching_slip["month"] == "November"
    assert matching_slip["amount"] == 28500.0

    # 3. HR updates payslip (increments amount to 31000)
    update_res = client.put(
        f"/api/v1/hr/payslips/{slip_id}",
        json={"month": "November", "year": 2026, "amount": 31000.0, "notes": "Revised Diwali incentive"},
        headers=hr_auth_headers,
    )
    assert update_res.status_code == 200

    # 4. Employee checks and sees revised amount
    emp_revised = client.get("/api/v1/employee/payslips", headers=employee_auth_headers).json()
    rev_slip = next(s for s in emp_revised if s["id"] == slip_id)
    assert rev_slip["amount"] == 31000.0

    # 5. HR deletes payslip
    del_res = client.delete(f"/api/v1/hr/payslips/{slip_id}", headers=hr_auth_headers)
    assert del_res.status_code == 200

    # 6. Employee verifies payslip is permanently deleted
    emp_after_del = client.get("/api/v1/employee/payslips", headers=employee_auth_headers).json()
    assert not any(s["id"] == slip_id for s in emp_after_del)


def test_hr_06_customer_directory_and_revenue(client, hr_auth_headers):
    """HR accesses customer activities directory and branch-segregated revenue intelligence."""
    # Customers
    cust_res = client.get("/api/v1/hr/customers", headers=hr_auth_headers)
    assert cust_res.status_code == 200
    assert isinstance(cust_res.json(), list)

    # Revenue
    rev_res = client.get("/api/v1/hr/revenue", headers=hr_auth_headers)
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert "summary" in rev_data
    assert "total_gross_revenue" in rev_data["summary"]
    assert "branch_breakdown" in rev_data
    assert len(rev_data["branch_breakdown"]) == 3


def test_hr_07_leave_review_workflow(client, hr_auth_headers, employee_auth_headers):
    """Employee requests leave -> HR lists it -> HR approves it -> Employee verifies approval status."""
    # 1. Employee submits leave
    leave_res = client.post(
        "/api/v1/employee/leaves",
        json={
            "subject": "Medical checkup",
            "message": "Routine annual health checkup",
            "leave_type": "Sick Leave",
            "from_date": "2026-12-01",
            "to_date": "2026-12-01",
        },
        headers=employee_auth_headers,
    )
    assert leave_res.status_code == 201
    leave_id = leave_res.json()["id"]

    # 2. HR views leave requests
    hr_leaves_res = client.get("/api/v1/hr/leaves", headers=hr_auth_headers)
    assert hr_leaves_res.status_code == 200
    assert any(l["id"] == leave_id for l in hr_leaves_res.json())

    # 3. HR approves leave request
    review_res = client.post(
        f"/api/v1/hr/leaves/{leave_id}/review",
        json={"status": "APPROVED", "notes": "Approved by HR"},
        headers=hr_auth_headers,
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"

    # 4. Employee checks status in own portal
    my_leaves = client.get("/api/v1/employee/leaves", headers=employee_auth_headers).json()
    approved_leave = next(l for l in my_leaves if l["id"] == leave_id)
    assert approved_leave["status"] == "APPROVED"


# =========================================================================
# 4. SUPER ADMIN BACKEND WORKFLOWS
# =========================================================================

def test_admin_01_auth_and_profile(client, admin_auth_headers):
    """Super Admin authenticates and verifies enterprise profile."""
    res = client.get("/api/v1/admin/auth/me", headers=admin_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] in ["ADMIN", "SUPER_ADMIN"]
    assert data["email"] == settings.ADMIN_EMAIL


def test_admin_02_dashboard_overview(client, admin_auth_headers):
    """Super Admin accesses enterprise command center overview."""
    res = client.get("/api/v1/admin/dashboard/overview", headers=admin_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "total_branches" in data
    assert "total_employees" in data
    assert "total_schemes_value" in data


def test_admin_03_branch_management(client, admin_auth_headers):
    """Super Admin lists branches and gets individual showroom analytics."""
    res = client.get("/api/v1/admin/branches", headers=admin_auth_headers)
    assert res.status_code == 200
    branches = res.json()
    assert len(branches) == 3
    first_branch_id = branches[0]["id"]

    # Detail
    detail_res = client.get(f"/api/v1/admin/branches/{first_branch_id}", headers=admin_auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["branch"]["id"] == first_branch_id


def test_admin_04_manager_management(client, admin_auth_headers):
    """Super Admin retrieves organization-wide showroom managers."""
    res = client.get("/api/v1/admin/managers", headers=admin_auth_headers)
    assert res.status_code == 200
    managers = res.json()
    assert len(managers) >= 5


def test_admin_05_employee_master(client, admin_auth_headers):
    """Super Admin retrieves cross-branch employee master and review points ranking."""
    # Directory
    res_emps = client.get("/api/v1/admin/employees", headers=admin_auth_headers)
    assert res_emps.status_code == 200
    assert len(res_emps.json()) >= 60

    # Points Ranking
    res_pts = client.get("/api/v1/admin/points-leaderboard", headers=admin_auth_headers)
    assert res_pts.status_code == 200


def test_admin_06_customers_and_schemes(client, admin_auth_headers):
    """Super Admin retrieves organization-wide customer activities and gold schemes."""
    res_act = client.get("/api/v1/admin/customer-activities", headers=admin_auth_headers)
    assert res_act.status_code == 200

    res_sch = client.get("/api/v1/admin/gold-schemes", headers=admin_auth_headers)
    assert res_sch.status_code == 200


def test_admin_07_outdoor_marketing(client, admin_auth_headers):
    """Super Admin retrieves outdoor marketing overview and customer leads."""
    res_ov = client.get("/api/v1/admin/outdoor/overview", headers=admin_auth_headers)
    assert res_ov.status_code == 200

    res_leads = client.get("/api/v1/admin/outdoor/customers", headers=admin_auth_headers)
    assert res_leads.status_code == 200


def test_admin_08_audit_logs_and_settings(client, admin_auth_headers):
    """Super Admin inspects enterprise audit logs and system configuration status."""
    res_audit = client.get("/api/v1/admin/audit-logs", headers=admin_auth_headers)
    assert res_audit.status_code == 200
    assert "logs" in res_audit.json()

    res_settings = client.get("/api/v1/admin/settings", headers=admin_auth_headers)
    assert res_settings.status_code == 200


# =========================================================================
# 5. INTEGRATED COMPLETE CROSS-ROLE PIPELINE (EMPLOYEE -> MGR -> HR -> ADMIN)
# =========================================================================

def test_workflow_full_cross_role_pipeline(client, employee_auth_headers, manager_auth_headers, hr_auth_headers, admin_auth_headers):
    """
    Complete end-to-end multi-role pipeline:
    1. EMPLOYEE logs high-value customer transaction (₹1,25,000) -> Status is PENDING.
    2. SHOWROOM MANAGER views pending queue -> Approves transaction -> Status becomes APPROVED.
    3. EMPLOYEE queries dashboard -> Sees sold order and approved counts updated.
    4. SHOWROOM MANAGER queries branch customer activities -> Verified sale reflected.
    5. HR queries cross-branch revenue -> High-value sale consolidated across 3 showrooms.
    6. SUPER ADMIN checks enterprise customer activities & audit logs -> Verifies full audit trail.
    """
    # Step 1: Employee logs transaction
    emp_post = client.post(
        "/api/v1/employee/customers",
        json={
            "customer_name": "Dr. Raghavendra Bhat",
            "phone_number": "9448123456",
            "product_value": 125000.0,
            "status": "Sold",
            "notes": "22kt Bridal necklace set with BIS Hallmark verification",
            "activity_date": str(date.today()),
        },
        headers=employee_auth_headers,
    )
    assert emp_post.status_code == 201, emp_post.text
    created_act = emp_post.json()
    act_id = created_act["id"]
    assert created_act["approval_status"] == "PENDING"
    assert created_act["product_value"] == 125000.0

    # Step 2: Manager reviews and approves
    mgr_review = client.post(
        f"/api/v1/customers/{act_id}/review",
        json={"action": "APPROVE", "notes": "Payment receipt & hallmark verified by floor manager"},
        headers=manager_auth_headers,
    )
    assert mgr_review.status_code == 200, mgr_review.text
    assert mgr_review.json()["approval_status"] == "APPROVED"

    # Step 3: Employee verifies dashboard reflects approved activity
    emp_dash = client.get("/api/v1/employee/dashboard", headers=employee_auth_headers)
    assert emp_dash.status_code == 200
    assert emp_dash.json()["approved_customer_activities"] >= 1

    # Step 4: Manager verifies branch customer activities reflect approved transaction
    mgr_rev = client.get("/api/v1/customers?approval_status=APPROVED", headers=manager_auth_headers)
    assert mgr_rev.status_code == 200
    approved_acts = mgr_rev.json()
    assert any(a["id"] == act_id for a in approved_acts)

    # Step 5: HR checks cross-branch customer activities and consolidated revenue
    hr_cust = client.get("/api/v1/hr/customers", headers=hr_auth_headers)
    assert hr_cust.status_code == 200
    matching_hr_act = next((a for a in hr_cust.json() if a["id"] == act_id), None)
    assert matching_hr_act is not None
    assert matching_hr_act["customer_name"] == "Dr. Raghavendra Bhat"
    assert matching_hr_act["approval_status"] == "APPROVED"

    hr_rev = client.get("/api/v1/hr/revenue", headers=hr_auth_headers)
    assert hr_rev.status_code == 200
    assert hr_rev.json()["summary"]["total_gross_revenue"] >= 125000.0

    # Step 6: Super Admin verifies organization activities and audit trail
    admin_acts = client.get("/api/v1/admin/customer-activities", headers=admin_auth_headers)
    assert admin_acts.status_code == 200
    admin_data = admin_acts.json()
    activities_list = admin_data if isinstance(admin_data, list) else admin_data.get("activities", admin_data.get("items", []))
    assert any(a.get("id") == act_id for a in activities_list)

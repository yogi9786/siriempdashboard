import json
import os
from contextlib import contextmanager
from datetime import date
from backend.app.main import app
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.product import StockProduct
from backend.app.models.attendance import EmployeeAttendance
from backend.app.models.feedback import CustomerFeedback
from backend.app.models.hr import EmployeePaySlip, EmployeeLeaveRequest
from backend.app.models.outdoor_marketing import OutdoorMarketingArea, OutdoorMarketingDuty, OutdoorMarketingCustomer
from backend.app.models.activity import (
    CustomerActivity,
    SchemeRecord,
    EmployeeFormMedia,
    GoogleReview,
    VideoReview,
    AttireRecord,
    EmployeeCallLog,
    SchemePaymentReminder,
)


def test_media_endpoints_headers_and_payslip_file(client, hr_auth_headers, tmp_path):
    """Verify /api/v1/uploads, /uploads, /api/v1/media, X-Frame-Options: SAMEORIGIN, and payslip file endpoint."""
    original_media_dir = settings.MEDIA_DIR
    settings.MEDIA_DIR = str(tmp_path)
    try:
        pdf_path = tmp_path / "payslip_sample.pdf"
        pdf_path.write_bytes(b"%PDF-1.4\n%test\n%%EOF\n")

        outdoor_dir = tmp_path / "outdoor" / "photos"
        outdoor_dir.mkdir(parents=True, exist_ok=True)
        img_path = outdoor_dir / "field_proof.png"
        img_path.write_bytes(b"\x89PNG\r\n\x1a\n")

        for url_path, expected_ctype in (
            ("/uploads/payslip_sample.pdf", "application/pdf"),
            ("/api/v1/uploads/payslip_sample.pdf", "application/pdf"),
            ("/api/v1/media/payslip_sample.pdf", "application/pdf"),
            ("/api/v1/uploads/outdoor/photos/field_proof.png", "image/png"),
        ):
            res = client.get(url_path)
            assert res.status_code == 200, f"Failed for {url_path}: {res.text}"
            assert res.headers.get("x-frame-options") == "SAMEORIGIN"
            assert expected_ctype in (res.headers.get("content-type") or "").lower()

        # Verify path traversal protection
        trav = client.get("/api/v1/uploads/../../backend/app/main.py")
        assert trav.status_code == 404

        # Verify HR payslip download/file endpoint
        emp_res = client.get("/api/v1/hr/employees", headers=hr_auth_headers)
        emp_id = emp_res.json()[0]["id"]
        slip_res = client.post(
            "/api/v1/hr/payslips",
            json={
                "employee_id": emp_id,
                "month": "December",
                "year": 2026,
                "amount": 25000,
                "file_url": "/uploads/payslip_sample.pdf",
                "issued_date": str(date.today()),
            },
            headers=hr_auth_headers,
        )
        assert slip_res.status_code in (200, 201), slip_res.text
        slip_id = slip_res.json()["id"]

        file_res = client.get(f"/api/v1/hr/payslips/{slip_id}/file", headers=hr_auth_headers)
        assert file_res.status_code == 200
        assert file_res.headers.get("x-frame-options") == "SAMEORIGIN"
        assert "application/pdf" in (file_res.headers.get("content-type") or "").lower()

        client.delete(f"/api/v1/hr/payslips/{slip_id}", headers=hr_auth_headers)
    finally:
        settings.MEDIA_DIR = original_media_dir


@contextmanager
def _test_db_session():
    db_gen = app.dependency_overrides[get_db]()
    db = next(db_gen)
    try:
        yield db
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass


def test_gagan_employee_visible_even_with_manager_account(client, manager_auth_headers):
    """Ensure active showroom employee GAGAN (EMP-YEL-214) appears alongside manager GAGAN1234."""
    with _test_db_session() as db:
        emp_gagan = db.query(Employee).filter(Employee.employee_code == "EMP-YEL-214").first()
        assert emp_gagan is not None

        existing_mgr = db.query(User).filter(User.username == settings.MANAGER_6_USERNAME).first()
        if not existing_mgr:
            created_mgr = User(
                branch_id=emp_gagan.branch_id,
                email="gagan1234@sirisamruddhigold.com",
                username=settings.MANAGER_6_USERNAME,
                full_name=settings.MANAGER_6_NAME,
                hashed_password=get_password_hash(settings.MANAGER_6_PASSWORD),
                role="MANAGER",
                is_active=True,
            )
            db.add(created_mgr)
            db.commit()

    # Check public login branch list
    r_branch = client.get("/api/v1/auth/branches/YELAHANKA/employees")
    assert r_branch.status_code == 200
    assert any(e["employee_code"] == "EMP-YEL-214" and e["full_name"] == "GAGAN" for e in r_branch.json())

    # Check manager roster and points-ranking
    r_list = client.get("/api/v1/employees", headers=manager_auth_headers)
    assert r_list.status_code == 200
    assert any(e["employee_code"] == "EMP-YEL-214" for e in r_list.json())

    r_rank = client.get("/api/v1/employees/points-ranking", headers=manager_auth_headers)
    assert r_rank.status_code == 200
    assert any(e["employee_code"] == "EMP-YEL-214" for e in r_rank.json())
    assert not any((e.get("designation") or "").lower().find("manager") >= 0 for e in r_rank.json())


def _seed_full_employee_dependencies(db, branch_id: int, code: str) -> tuple[int, int, int]:
    """Create an employee and attach every foreign-key dependent table row."""
    emp = Employee(
        branch_id=branch_id,
        employee_code=code,
        full_name=f"Dep Test {code}",
        designation="Sales Executive",
        department="Sales",
        date_of_joining=date.today(),
        status="active",
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    area = OutdoorMarketingArea(
        branch_id=branch_id,
        area_name=f"Area {code}",
        location="Yelahanka, Bangalore",
        assigned_employee_id=emp.id,
    )
    act = CustomerActivity(
        branch_id=branch_id,
        employee_id=emp.id,
        customer_name="Activity Cust",
        phone_number="9876543210",
        activity_date=date.today(),
        status="Sold",
        product_value=50000,
    )
    duty = OutdoorMarketingDuty(
        branch_id=branch_id,
        employee_id=emp.id,
        date=date.today(),
        area="Test Area",
    )
    db.add_all([area, act, duty])
    db.flush()

    reminder = SchemePaymentReminder(
        branch_id=branch_id,
        employee_id=emp.id,
        customer_activity_id=act.id,
        customer_name="Activity Cust",
        scheme_name="Gold Scheme",
        due_date=date.today(),
    )
    db.add_all([
        reminder,
        EmployeeAttendance(branch_id=branch_id, employee_id=emp.id, date=date.today(), status="Present"),
        CustomerFeedback(branch_id=branch_id, employee_id=emp.id, customer_name="FB Cust", feedback_text="Great"),
        EmployeePaySlip(branch_id=branch_id, employee_id=emp.id, month="Nov", year=2026, file_url="/uploads/x.pdf"),
        EmployeeLeaveRequest(branch_id=branch_id, employee_id=emp.id, subject="Leave", message="Msg", from_date=date.today(), to_date=date.today(), days_count=1),
        OutdoorMarketingCustomer(branch_id=branch_id, marketing_employee_id=emp.id, duty_id=duty.id, customer_name="Out Cust", date=date.today()),
        SchemeRecord(branch_id=branch_id, employee_id=emp.id, scheme_name="Gold", record_date=date.today()),
        EmployeeFormMedia(branch_id=branch_id, employee_id=emp.id, form_type="Closing", file_path="uploads/f.jpg", file_url="/uploads/f.jpg", mime_type="image/jpeg", file_size=1024),
        GoogleReview(branch_id=branch_id, employee_id=emp.id, customer_name="GR Cust", review_text="Nice", review_date=date.today()),
        VideoReview(branch_id=branch_id, employee_id=emp.id, customer_name="VR Cust", review_date=date.today()),
        AttireRecord(branch_id=branch_id, employee_id=emp.id, check_date=date.today(), status="Proper"),
        EmployeeCallLog(branch_id=branch_id, employee_id=emp.id, customer_name="Call Cust", call_date=date.today()),
    ])
    db.commit()
    return emp.id, area.id, reminder.id


def test_hr_and_manager_delete_employee_with_dependencies(client, hr_auth_headers, manager_auth_headers):
    """Both HR and Manager delete endpoints must cleanly delete employees with child records and detach nullable refs."""
    with _test_db_session() as db:
        emp_hr_id, area_id, rem_id = _seed_full_employee_dependencies(db, 1, "EMP-DEL-HR1")
        emp_mgr_id, area2_id, rem2_id = _seed_full_employee_dependencies(db, 1, "EMP-DEL-MGR1")

    res_hr = client.delete(f"/api/v1/hr/employees/{emp_hr_id}", headers=hr_auth_headers)
    assert res_hr.status_code == 200, res_hr.text

    res_mgr = client.delete(f"/api/v1/employees/{emp_mgr_id}", headers=manager_auth_headers)
    assert res_mgr.status_code == 200, res_mgr.text

    with _test_db_session() as db:
        assert db.query(Employee).filter(Employee.id.in_([emp_hr_id, emp_mgr_id])).count() == 0
        # Nullable refs should remain intact with FK set to None
        assert db.query(OutdoorMarketingArea).filter(OutdoorMarketingArea.id == area_id).first().assigned_employee_id is None
        assert db.query(OutdoorMarketingArea).filter(OutdoorMarketingArea.id == area2_id).first().assigned_employee_id is None
        assert db.query(SchemePaymentReminder).filter(SchemePaymentReminder.id == rem_id).first().employee_id is None
        assert db.query(SchemePaymentReminder).filter(SchemePaymentReminder.id == rem2_id).first().employee_id is None


def test_stock_product_lookup_slash_tags_and_auto_enrichment(client, manager_auth_headers, employee_auth_headers):
    """Verify product lookup by tag/name, route order with /products/sold/catalog, and auto-enrichment on save."""
    with _test_db_session() as db:
        for tag, name, itype, counter in (
            ("7231412", "STUDS", "916", "STUDS"),
            ("TAG/99/1", "ANTIQUE HARAM", "916", "HARA AND BANGLES"),
        ):
            if not db.query(StockProduct).filter(StockProduct.tag_no == tag).first():
                db.add(StockProduct(
                    tag_no=tag,
                    item_id="9",
                    item_name=name,
                    sub_item="GOLD",
                    item_type=itype,
                    counter=counter,
                    gross_weight=12.5,
                    net_weight=12.0,
                    pcs=1,
                    is_sold=False,
                ))
        db.commit()

    # Lookup autocomplete
    r_lookup = client.get("/api/v1/products/lookup", params={"q": "7231"})
    assert r_lookup.status_code == 200
    assert any(p["tag_no"] == "7231412" and p["counter"] == "STUDS" and p["item_type"] == "916" for p in r_lookup.json())

    # Literal route /products/sold/catalog must NOT be shadowed by /{tag_no:path}
    r_catalog = client.get("/api/v1/products/sold/catalog")
    assert r_catalog.status_code == 200, r_catalog.text
    assert "items" in r_catalog.json()

    # Special character tag via both query param and path param
    r_slash_q = client.get("/api/v1/products/by-tag", params={"tag_no": "TAG/99/1"})
    assert r_slash_q.status_code == 200
    assert r_slash_q.json()["item_name"] == "ANTIQUE HARAM"
    assert r_slash_q.json()["counter"] == "HARA AND BANGLES"

    r_slash_p = client.get("/api/v1/products/TAG/99/1")
    assert r_slash_p.status_code == 200
    assert r_slash_p.json()["item_name"] == "ANTIQUE HARAM"

    # Saving activity with product_id and blank product_name auto-enriches breakdown
    breakdown = json.dumps([
        {"id": 1, "name": "Stock Cust", "phone": "9988776655", "status": "Sold", "product_id": "7231412", "product_name": "", "product_value": 85000}
    ])
    act_res = client.post(
        "/api/v1/employee/customers",
        json={
            "customer_name": "Stock Cust",
            "phone_number": "9988776655",
            "customers_count": 1,
            "product_value": 85000,
            "breakdown": breakdown,
            "activity_date": str(date.today()),
            "status": "Sold",
        },
        headers=employee_auth_headers,
    )
    assert act_res.status_code in (200, 201), act_res.text
    saved_breakdown = json.loads(act_res.json()["breakdown"])
    assert saved_breakdown[0]["product_name"] == "STUDS"
    assert saved_breakdown[0]["product_category"] == "STUDS"
    assert saved_breakdown[0]["product_type"] == "916"

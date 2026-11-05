import logging
from typing import List, Optional
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.whatsapp import WhatsAppTemplate, WhatsAppMessageLog
from backend.app.schemas.whatsapp import (
    WhatsAppTemplateCreate,
    WhatsAppTemplateUpdate,
    WhatsAppTemplateResponse,
    SendBulkWhatsAppRequest,
    SendBulkWhatsAppResponse,
    WhatsAppMessageLogResponse,
    WhatsAppStatsResponse,
)
from backend.app.services.aisensy_service import AiSensyService
from backend.app.dependencies.auth import (
    get_current_manager,
    get_current_manager_or_admin,
    SuperAdminIdentity,
)

logger = logging.getLogger("whatsapp_router")

router = APIRouter(prefix="/api/v1/whatsapp", tags=["WhatsApp Marketing & Outreach"])


DEFAULT_TEMPLATES = [
    {
        "name": "Diwali Festival Special Offer",
        "campaign_name": "diwali_festival_special",
        "template_id": "festival_offer_v1",
        "category": "Festival & Offers",
        "description": "Celebrate this festive season with Siri Samruddhi Gold Palace! Enjoy zero making charges on select gold jewellery & exclusive silver gift sets.",
        "media_url": None,
    },
    {
        "name": "Gold Exchange Privilege",
        "campaign_name": "customer_exchange_thank_you",
        "template_id": "exchange_privilege_v1",
        "category": "Exchange",
        "description": "Thank you for visiting Siri Samruddhi Gold Palace. Bring your old gold and upgrade to 100% BIS Hallmarked 916 HUID bridal and daily-wear collections.",
        "media_url": None,
    },
    {
        "name": "Special Purchase Thank You",
        "campaign_name": "sold-camp",
        "template_id": "customer_purchase_thank_you",
        "category": "Sold",
        "description": "Hearty congratulations on your precious purchase from Siri Samruddhi Gold Palace! We look forward to adorning your special moments.",
        "media_url": None,
    },
    {
        "name": "Reserved Jewellery In-Hold Follow-up",
        "campaign_name": "customer_in_hold_update",
        "template_id": "lead_follow_up_v1",
        "category": "Follow-up",
        "description": "Greetings from Siri Samruddhi Gold Palace. Your selected jewellery design is reserved for you. Visit our showroom or reply to finalize your purchase.",
        "media_url": None,
    },
    {
        "name": "New Bridal & Antique Collection Arrival",
        "campaign_name": "new_bridal_collection_arrival",
        "template_id": "new_collection_v1",
        "category": "Offers",
        "description": "Explore our newly arrived handcrafted antique gold & diamond bridal collections at Siri Samruddhi Gold Palace. Special showroom prices valid this week!",
        "media_url": None,
    },
]


def _seed_default_templates_if_empty(db: Session):
    """Seeds showroom standard templates if table has no records."""
    count = db.query(WhatsAppTemplate).count()
    if count == 0:
        for tpl_data in DEFAULT_TEMPLATES:
            tpl = WhatsAppTemplate(**tpl_data, is_active=True)
            db.add(tpl)
        try:
            db.commit()
            logger.info("Successfully seeded default showroom WhatsApp templates.")
        except Exception as e:
            db.rollback()
            logger.warning(f"Error seeding default templates: {e}")


# ---------------------------------------------------------------------------
# Templates CRUD Endpoints
# ---------------------------------------------------------------------------

@router.get("/templates", response_model=List[WhatsAppTemplateResponse], summary="List all active WhatsApp templates")
def list_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name or campaign"),
    db: Session = Depends(get_db),
    _user=Depends(get_current_manager_or_admin),
):
    _seed_default_templates_if_empty(db)

    query = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.is_active == True)
    if category and category.lower() != "all":
        query = query.filter(func.lower(WhatsAppTemplate.category) == category.lower())
    if search:
        search_fmt = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(WhatsAppTemplate.name).like(search_fmt)
            | func.lower(WhatsAppTemplate.campaign_name).like(search_fmt)
            | func.lower(WhatsAppTemplate.template_id).like(search_fmt)
        )
    return query.order_by(desc(WhatsAppTemplate.id)).all()


@router.post("/templates", response_model=WhatsAppTemplateResponse, status_code=status.HTTP_201_CREATED, summary="Create a new WhatsApp campaign template")
def create_template(
    template_in: WhatsAppTemplateCreate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_manager_or_admin),
):
    existing = (
        db.query(WhatsAppTemplate)
        .filter(func.lower(WhatsAppTemplate.campaign_name) == template_in.campaign_name.strip().lower())
        .first()
    )
    if existing and existing.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A template with campaign name '{template_in.campaign_name}' already exists.",
        )

    tpl = WhatsAppTemplate(
        name=template_in.name.strip(),
        campaign_name=template_in.campaign_name.strip(),
        template_id=template_in.template_id.strip(),
        category=template_in.category.strip() or "Offers",
        description=(template_in.description or "").strip(),
        media_url=(template_in.media_url or "").strip() or None,
        is_active=template_in.is_active,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.put("/templates/{template_id}", response_model=WhatsAppTemplateResponse, summary="Update an existing WhatsApp campaign template")
def update_template(
    template_id: int,
    template_in: WhatsAppTemplateUpdate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_manager_or_admin),
):
    tpl = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found.")

    if template_in.name is not None:
        tpl.name = template_in.name.strip()
    if template_in.campaign_name is not None:
        tpl.campaign_name = template_in.campaign_name.strip()
    if template_in.template_id is not None:
        tpl.template_id = template_in.template_id.strip()
    if template_in.category is not None:
        tpl.category = template_in.category.strip()
    if template_in.description is not None:
        tpl.description = template_in.description.strip()
    if template_in.media_url is not None:
        tpl.media_url = template_in.media_url.strip() or None
    if template_in.is_active is not None:
        tpl.is_active = template_in.is_active

    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/templates/{template_id}", summary="Delete or deactivate a WhatsApp campaign template")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    _user=Depends(get_current_manager_or_admin),
):
    tpl = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found.")

    db.delete(tpl)
    db.commit()
    return {"success": True, "message": f"Template '{tpl.name}' deleted successfully."}


# ---------------------------------------------------------------------------
# Bulk Send WhatsApp Messages Endpoint (Showroom Managers)
# ---------------------------------------------------------------------------

@router.post("/send-bulk", response_model=SendBulkWhatsAppResponse, summary="Send WhatsApp message to selected customers")
def send_bulk_whatsapp(
    payload: SendBulkWhatsAppRequest,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    """
    Dispatches a selected template/campaign to multiple customer phone numbers.
    Audit logs each dispatch with delivery result (SENT, SIMULATED, FAILED, DEDUPLICATED).
    """
    if not payload.customers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No customer recipients provided.")

    campaign_name = payload.campaign_name.strip()
    template_id = (payload.template_id or "").strip() or campaign_name
    category = (payload.category or "Offers").strip()
    media_url = (payload.media_url or "").strip() or None

    manager_name = getattr(current_manager, "full_name", "Manager")
    manager_id = getattr(current_manager, "id", None)
    branch_id = getattr(current_manager, "branch_id", None)

    results = []
    sent_count = 0
    simulated_count = 0
    failed_count = 0
    dedup_count = 0

    for item in payload.customers:
        raw_phone = (item.phone or "").strip()
        cust_name = (item.name or "Customer").strip()

        if not raw_phone:
            failed_count += 1
            results.append({
                "customer_name": cust_name,
                "phone": raw_phone,
                "status": "FAILED",
                "error": "Missing phone number",
            })
            continue

        # Format and dispatch
        try:
            res = AiSensyService.send_whatsapp_message(
                destination=raw_phone,
                user_name=cust_name,
                template_name=campaign_name,
                media_url=media_url,
            )

            is_success = res.get("success", False)
            is_simulated = res.get("simulated", False)
            is_dedup = res.get("deduplicated", False)

            if is_dedup:
                log_status = "DEDUPLICATED"
                dedup_count += 1
            elif is_simulated:
                log_status = "SIMULATED"
                simulated_count += 1
            elif is_success:
                log_status = "SENT"
                sent_count += 1
            else:
                log_status = "FAILED"
                failed_count += 1

            status_msg = res.get("message") or res.get("error") or ("Message sent successfully" if is_success else "Send failed")

            # Write to audit log
            log_entry = WhatsAppMessageLog(
                branch_id=branch_id,
                manager_id=manager_id,
                manager_name=manager_name,
                customer_name=cust_name,
                phone_number=raw_phone,
                campaign_name=campaign_name,
                template_id=template_id,
                category=category,
                status=log_status,
                status_details=status_msg,
            )
            db.add(log_entry)

            results.append({
                "customer_name": cust_name,
                "phone": raw_phone,
                "status": log_status,
                "message": status_msg,
            })
        except Exception as e:
            failed_count += 1
            err_msg = str(e)
            logger.error(f"Error sending WhatsApp to {raw_phone}: {err_msg}", exc_info=True)

            log_entry = WhatsAppMessageLog(
                branch_id=branch_id,
                manager_id=manager_id,
                manager_name=manager_name,
                customer_name=cust_name,
                phone_number=raw_phone,
                campaign_name=campaign_name,
                template_id=template_id,
                category=category,
                status="FAILED",
                status_details=f"Exception: {err_msg}",
            )
            db.add(log_entry)

            results.append({
                "customer_name": cust_name,
                "phone": raw_phone,
                "status": "FAILED",
                "error": err_msg,
            })

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to commit WhatsApp message logs: {e}")

    total_req = len(payload.customers)
    effective_sent = sent_count + simulated_count + dedup_count
    summary_message = (
        f"Dispatched campaign '{campaign_name}' to {total_req} recipient(s): "
        f"{sent_count} live sent, {simulated_count} simulated, {dedup_count} deduped, {failed_count} failed."
    )

    return SendBulkWhatsAppResponse(
        success=effective_sent > 0,
        total_requested=total_req,
        sent_count=sent_count,
        failed_count=failed_count,
        simulated_count=simulated_count,
        deduplicated_count=dedup_count,
        details=results,
        message=summary_message,
    )


# ---------------------------------------------------------------------------
# Sent Message Logs & Stats Endpoints (Managers & Super Admin)
# ---------------------------------------------------------------------------

@router.get("/logs", response_model=List[WhatsAppMessageLogResponse], summary="List sent WhatsApp message history logs")
def list_whatsapp_logs(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID (Super Admin)"),
    status: Optional[str] = Query(None, description="Filter by status: SENT, SIMULATED, FAILED"),
    campaign_name: Optional[str] = Query(None, description="Filter by campaign"),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_manager_or_admin),
):
    query = db.query(WhatsAppMessageLog)

    # If manager, isolate to their branch
    if isinstance(user, User):
        if user.branch_id:
            query = query.filter(WhatsAppMessageLog.branch_id == user.branch_id)
    elif branch_id:
        query = query.filter(WhatsAppMessageLog.branch_id == branch_id)

    if status and status.lower() != "all":
        query = query.filter(func.lower(WhatsAppMessageLog.status) == status.lower())
    if campaign_name and campaign_name.lower() != "all":
        query = query.filter(func.lower(WhatsAppMessageLog.campaign_name) == campaign_name.lower())
    if search:
        search_fmt = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(WhatsAppMessageLog.customer_name).like(search_fmt)
            | func.lower(WhatsAppMessageLog.phone_number).like(search_fmt)
            | func.lower(WhatsAppMessageLog.manager_name).like(search_fmt)
            | func.lower(WhatsAppMessageLog.campaign_name).like(search_fmt)
        )

    return query.order_by(desc(WhatsAppMessageLog.sent_at)).offset(offset).limit(limit).all()


@router.get("/stats", response_model=WhatsAppStatsResponse, summary="Summary statistics of sent WhatsApp messages")
def get_whatsapp_stats(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    db: Session = Depends(get_db),
    user=Depends(get_current_manager_or_admin),
):
    query = db.query(WhatsAppMessageLog)

    if isinstance(user, User):
        if user.branch_id:
            query = query.filter(WhatsAppMessageLog.branch_id == user.branch_id)
    elif branch_id:
        query = query.filter(WhatsAppMessageLog.branch_id == branch_id)

    logs = query.all()
    now = datetime.now(timezone.utc)
    today_date = now.date()
    month_val = now.month
    year_val = now.year

    total_sent = 0
    sent_today = 0
    sent_this_month = 0
    total_simulated = 0
    total_failed = 0
    by_campaign = {}
    by_category = {}

    for log in logs:
        st = (log.status or "").upper()
        if st in ["SENT", "SIMULATED", "DEDUPLICATED"]:
            total_sent += 1
            if st == "SIMULATED":
                total_simulated += 1
        elif st == "FAILED":
            total_failed += 1

        sent_time = log.sent_at
        if sent_time:
            if sent_time.date() == today_date and st in ["SENT", "SIMULATED", "DEDUPLICATED"]:
                sent_today += 1
            if sent_time.year == year_val and sent_time.month == month_val and st in ["SENT", "SIMULATED", "DEDUPLICATED"]:
                sent_this_month += 1

        cmp = log.campaign_name or "Unknown"
        by_campaign[cmp] = by_campaign.get(cmp, 0) + 1

        cat = log.category or "General"
        by_category[cat] = by_category.get(cat, 0) + 1

    return WhatsAppStatsResponse(
        total_sent=total_sent,
        sent_today=sent_today,
        sent_this_month=sent_this_month,
        total_simulated=total_simulated,
        total_failed=total_failed,
        by_campaign=by_campaign,
        by_category=by_category,
    )


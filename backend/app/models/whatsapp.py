from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class WhatsAppTemplate(Base):
    """
    Stores pre-approved AiSensy / Meta WhatsApp templates and campaign identifiers
    for marketing, offers, festival promotions, and customer follow-ups.
    """
    __tablename__ = "whatsapp_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)  # Display title e.g. "Diwali Festival Special"
    campaign_name = Column(String(150), nullable=False)  # AiSensy Campaign ID / Name
    template_id = Column(String(150), nullable=False)  # Meta / AiSensy Template ID
    category = Column(String(100), default="Offers", nullable=False)  # Offers, Festival, Follow-up, Sold, Exchange, General
    description = Column(Text, nullable=True)  # Message preview or body text
    media_url = Column(String(500), nullable=True)  # Optional banner image or catalogue URL
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class WhatsAppMessageLog(Base):
    """
    Audit log of all WhatsApp messages dispatched to showroom customers via AiSensy.
    Allows Showroom Managers and Super Admin to track sent campaigns, recipients, and statuses.
    """
    __tablename__ = "whatsapp_message_logs"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True, index=True)
    manager_id = Column(Integer, nullable=True, index=True)
    manager_name = Column(String(150), nullable=True)
    customer_name = Column(String(150), nullable=False)
    phone_number = Column(String(50), nullable=False, index=True)
    campaign_name = Column(String(150), nullable=False)
    template_id = Column(String(150), nullable=True)
    category = Column(String(100), nullable=True)
    status = Column(String(50), default="SENT", nullable=False)  # SENT, SIMULATED, FAILED, DEDUPLICATED
    status_details = Column(Text, nullable=True)  # AiSensy response or failure reason
    sent_at = Column(DateTime, default=utcnow, nullable=False, index=True)


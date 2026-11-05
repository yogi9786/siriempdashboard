from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class WhatsAppTemplateBase(BaseModel):
    name: str = Field(..., max_length=150, description="Display name for template e.g. Diwali Offer")
    campaign_name: str = Field(..., max_length=150, description="AiSensy Campaign Name / ID")
    template_id: str = Field(..., max_length=150, description="AiSensy / Meta Template ID")
    category: str = Field(default="Offers", max_length=100, description="Offers, Festival, Follow-up, Sold, Exchange, General")
    description: Optional[str] = Field(None, description="Message text preview or body")
    media_url: Optional[str] = Field(None, max_length=500, description="Optional image/banner URL")
    is_active: bool = True


class WhatsAppTemplateCreate(WhatsAppTemplateBase):
    pass


class WhatsAppTemplateUpdate(BaseModel):
    name: Optional[str] = None
    campaign_name: Optional[str] = None
    template_id: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    media_url: Optional[str] = None
    is_active: Optional[bool] = None


class WhatsAppTemplateResponse(WhatsAppTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WhatsAppCustomerRecipient(BaseModel):
    name: str = Field(..., description="Customer name")
    phone: str = Field(..., description="Customer 10-digit or formatted phone number")


class SendBulkWhatsAppRequest(BaseModel):
    customers: List[WhatsAppCustomerRecipient] = Field(..., min_length=1, description="List of customers to receive the message")
    campaign_name: str = Field(..., description="AiSensy Campaign ID / Name to trigger")
    template_id: Optional[str] = Field(None, description="Meta / AiSensy Template ID")
    template_name: Optional[str] = Field(None, description="Human readable template name")
    category: Optional[str] = Field(default="Offers", description="Campaign category")
    media_url: Optional[str] = Field(None, description="Optional image or promotional banner URL")
    notes: Optional[str] = Field(None, description="Optional internal campaign note")


class SendBulkWhatsAppResponse(BaseModel):
    success: bool
    total_requested: int
    sent_count: int
    failed_count: int
    simulated_count: int
    deduplicated_count: int
    details: List[Dict[str, Any]]
    message: str


class WhatsAppMessageLogResponse(BaseModel):
    id: int
    branch_id: Optional[int] = None
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    customer_name: str
    phone_number: str
    campaign_name: str
    template_id: Optional[str] = None
    category: Optional[str] = None
    status: str
    status_details: Optional[str] = None
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WhatsAppStatsResponse(BaseModel):
    total_sent: int
    sent_today: int
    sent_this_month: int
    total_simulated: int
    total_failed: int
    by_campaign: Dict[str, int] = {}
    by_category: Dict[str, int] = {}

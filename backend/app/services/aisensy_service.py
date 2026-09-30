import re
import json
import logging
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional, Tuple
from backend.app.core.config import settings

logger = logging.getLogger("aisensy_service")


class AiSensyService:
    """
    AiSensy WhatsApp Business API Integration Service.
    Handles phone formatting, outcome template mapping, parameter binding,
    and message dispatching for customer activity interactions.
    """

    @staticmethod
    def format_phone_number(phone: Optional[str]) -> Optional[str]:
        """
        Sanitizes and standardizes phone number for WhatsApp / AiSensy delivery.
        - Standard 10-digit Indian numbers (e.g. 9876543210) -> 919876543210
        - 11-digit numbers with leading 0 (e.g. 09876543210) -> 919876543210
        - Numbers with +91 or other international codes -> digits only
        """
        if not phone:
            return None
        
        # Remove all non-digits
        digits = re.sub(r"\D", "", str(phone).strip())
        if not digits:
            return None

        # If 10 digits, assume India (+91)
        if len(digits) == 10:
            return f"91{digits}"
        
        # If 11 digits starting with 0, drop leading 0 and prepend 91
        if len(digits) == 11 and digits.startswith("0"):
            return f"91{digits[1:]}"

        # If 12 digits starting with 91, it is already valid
        if len(digits) == 12 and digits.startswith("91"):
            return digits

        # Return as-is if already international format (>= 10 digits)
        if len(digits) >= 10:
            return digits

        return None

    @classmethod
    def get_campaign_config_for_status(cls, status_str: Optional[str]) -> Tuple[str, str, str]:
        """
        Maps the customer interaction outcome status to the configured AiSensy campaign name and API key.
        Returns a tuple: (campaign_name, api_key, human_readable_title)
        """
        status_norm = (status_str or "Walkin").strip().lower()
        master_key = (getattr(settings, "AISENSY_API_KEY", "") or "").strip()

        if status_norm in ["sold", "purchased", "closed", "sale"]:
            camp = (
                getattr(settings, "AISENSY_CAMPAIGN_SOLD", None)
                or getattr(settings, "AISENSY_TEMPLATE_SOLD", None)
                or "sold-camp"
            ).strip()
            key = (getattr(settings, "AISENSY_API_KEY_SOLD", None) or master_key).strip()
            return camp, key, "Purchased / Sold"

        if status_norm in ["exchange", "gold exchange", "jewellery exchange"]:
            camp = (
                getattr(settings, "AISENSY_CAMPAIGN_EXCHANGE", None)
                or getattr(settings, "AISENSY_TEMPLATE_EXCHANGE", None)
                or "customer_exchange_thank_you"
            ).strip()
            key = (getattr(settings, "AISENSY_API_KEY_EXCHANGE", None) or master_key).strip()
            return camp, key, "Gold Exchange"

        if status_norm in ["in hold / follow up", "in hold", "hold", "follow up", "follow-up", "callback"]:
            camp = (
                getattr(settings, "AISENSY_CAMPAIGN_IN_HOLD", None)
                or getattr(settings, "AISENSY_TEMPLATE_IN_HOLD", None)
                or "customer_in_hold_update"
            ).strip()
            key = (getattr(settings, "AISENSY_API_KEY_IN_HOLD", None) or master_key).strip()
            return camp, key, "In Hold / Follow Up"

        if status_norm in ["lost", "not interested", "left", "cancelled"]:
            camp = (
                getattr(settings, "AISENSY_CAMPAIGN_LOST", None)
                or getattr(settings, "AISENSY_TEMPLATE_LOST", None)
                or "customer_visit_thank_you"
            ).strip()
            key = (getattr(settings, "AISENSY_API_KEY_LOST", None) or master_key).strip()
            return camp, key, "Customer Appreciation (Lost/Inquiry)"

        # Default fallback is Walkin (Showroom Visit)
        camp = (
            getattr(settings, "AISENSY_CAMPAIGN_WALKIN", None)
            or getattr(settings, "AISENSY_TEMPLATE_WALKIN", None)
            or "customer_walkin_welcome"
        ).strip()
        key = (getattr(settings, "AISENSY_API_KEY_WALKIN", None) or master_key).strip()
        return camp, key, "Showroom Walk-in Welcome"

    @classmethod
    def get_media_url_for_status(cls, status_str: Optional[str]) -> Optional[str]:
        """
        Resolves the image / media header URL for templates that require media (e.g. customer_purchase_thank_you).
        """
        status_norm = (status_str or "Walkin").strip().lower()
        default_media = (
            getattr(settings, "AISENSY_MEDIA_URL", None)
            or getattr(settings, "AISENSY_DEFAULT_MEDIA_URL", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80")
        )

        if status_norm in ["sold", "purchased", "closed", "sale"]:
            url = getattr(settings, "AISENSY_MEDIA_URL_SOLD", None) or default_media
            return url.strip() if url else None

        if status_norm in ["exchange", "gold exchange", "jewellery exchange"]:
            url = getattr(settings, "AISENSY_MEDIA_URL_EXCHANGE", None) or default_media
            return url.strip() if url else None

        if status_norm in ["in hold / follow up", "in hold", "hold", "follow up", "follow-up", "callback"]:
            url = getattr(settings, "AISENSY_MEDIA_URL_IN_HOLD", None) or default_media
            return url.strip() if url else None

        if status_norm in ["lost", "not interested", "left", "cancelled"]:
            url = getattr(settings, "AISENSY_MEDIA_URL_LOST", None) or default_media
            return url.strip() if url else None

        url = getattr(settings, "AISENSY_MEDIA_URL_WALKIN", None) or default_media
        return url.strip() if url else None

    @classmethod
    def get_template_for_status(cls, status_str: Optional[str]) -> Tuple[str, str]:
        """
        Backward compatible helper returning (campaign_name, status_title).
        """
        camp, _, title = cls.get_campaign_config_for_status(status_str)
        return camp, title

    @classmethod
    def build_template_params(
        cls,
        status: str,
        customer_name: str,
        branch_name: str,
        employee_name: str,
        product_value: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> List[str]:
        """
        Builds the 5 template variables [{{1}}, {{2}}, {{3}}, {{4}}, {{5}}]
        structured for AiSensy message rendering (used when dynamic templates are enabled).
        """
        cust_name = customer_name.strip() if customer_name and customer_name.strip() else "Valued Patron"
        showroom = branch_name.strip() if branch_name and branch_name.strip() else "Siri Samruddhi Gold Palace"
        staff = employee_name.strip() if employee_name and employee_name.strip() else "Showroom Relationship Manager"
        val_str = f"Rs. {product_value:,.0f}" if product_value and product_value > 0 else "Special Auspicious Jewellery"
        note_str = notes.strip() if notes and notes.strip() else "Visit us for your gold, diamond, and silver needs."

        status_norm = status.strip().lower()

        if status_norm in ["sold", "purchased", "closed", "sale"]:
            return [cust_name, showroom, staff, val_str, note_str]

        if status_norm in ["exchange", "gold exchange", "jewellery exchange"]:
            return [cust_name, showroom, staff, val_str, note_str]

        if status_norm in ["in hold / follow up", "in hold", "hold", "follow up", "follow-up", "callback"]:
            item_desc = notes.strip() if notes and notes.strip() else f"Selected jewellery reserved ({val_str})"
            return [cust_name, showroom, staff, item_desc, "Feel free to contact us or revisit to finalize your jewellery."]

        if status_norm in ["lost", "not interested", "left", "cancelled"]:
            return [cust_name, showroom, staff, "We look forward to welcoming you back with exclusive bridal & temple designs."]

        # Walkin (General Inquiry / Browsing)
        inquiry_desc = notes.strip() if notes and notes.strip() else "Showroom Walk-in & Jewellery Browsing"
        return [cust_name, showroom, staff, inquiry_desc, "Looking forward to serving you again."]

    @classmethod
    def send_whatsapp_message(
        cls,
        destination: str,
        user_name: str,
        template_name: str,
        template_params: Optional[List[str]] = None,
        api_key: Optional[str] = None,
        media_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches a template/campaign message to destination phone number via AiSensy v2 API.
        If no live API key is configured, safely simulates delivery in development.
        """
        clean_phone = cls.format_phone_number(destination)
        if not clean_phone:
            return {
                "success": False,
                "error": f"Invalid destination phone number: '{destination}'",
                "phone": destination,
            }

        resolved_key = (api_key or getattr(settings, "AISENSY_API_KEY", "") or "").strip()
        
        # Build API endpoint from AISENSY_BASE_URL or AISENSY_API_URL
        base_url = (getattr(settings, "AISENSY_BASE_URL", "") or "https://backend.aisensy.com").strip().rstrip("/")
        explicit_url = getattr(settings, "AISENSY_API_URL", None)
        if explicit_url and "/campaign/t1/api/v2" in explicit_url:
            api_url = explicit_url.strip()
        else:
            api_url = f"{base_url}/campaign/t1/api/v2"

        # Check for unconfigured / placeholder key -> Return safe simulation
        is_placeholder_key = (
            not resolved_key
            or resolved_key == "your_aisensy_api_key_here"
            or resolved_key.startswith("your_")
            or resolved_key == "test"
        )

        # For static approved templates (e.g. customer_purchase_thank_you without {{1}}),
        # templateParams must be [] to prevent Meta parameter count mismatch error.
        send_params_enabled = getattr(settings, "AISENSY_SEND_TEMPLATE_PARAMS", False)
        params_to_send = template_params if (send_params_enabled and template_params) else []

        payload: Dict[str, Any] = {
            "apiKey": resolved_key if not is_placeholder_key else "SIMULATED_KEY",
            "campaignName": template_name,
            "destination": clean_phone,
            "userName": user_name or "Customer",
            "templateParams": params_to_send,
            "source": "Siri Samruddhi Dashboard",
        }

        # Attach media object if media_url is provided (required for templates with image headers)
        if media_url and str(media_url).strip():
            payload["media"] = {
                "url": str(media_url).strip(),
                "filename": "siri_samruddhi_jewellery.jpg",
            }

        if is_placeholder_key:
            logger.info(
                f"[AiSensy SIMULATION] WhatsApp message queued for {clean_phone} "
                f"using campaign '{template_name}'. Params: {params_to_send}"
            )
            return {
                "success": True,
                "simulated": True,
                "phone": clean_phone,
                "user_name": user_name,
                "campaign_name": template_name,
                "template": template_name,
                "message": (
                    f"Simulated WhatsApp delivery to +{clean_phone} using campaign '{template_name}'. "
                    "To enable live delivery, add your live AISENSY_API_KEY (or per-campaign key) in server .env."
                ),
                "params": params_to_send,
            }

        try:
            media_info = payload.get("media", {}).get("url", "None")
            logger.info(f"[AiSensy DISPATCH] Sending WhatsApp campaign '{template_name}' to +{clean_phone} | Media URL: {media_info}")
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                api_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "SiriSamruddhiDashboard/1.0",
                },
                method="POST",
            )
            
            with urllib.request.urlopen(req, timeout=15.0) as response:
                status_code = response.getcode()
                resp_bytes = response.read()
                resp_data = {}
                try:
                    resp_data = json.loads(resp_bytes.decode("utf-8"))
                except Exception:
                    resp_data = {"raw_text": resp_bytes.decode("utf-8", errors="ignore")}

                if status_code in [200, 201, 202]:
                    logger.info(f"[AiSensy SUCCESS] Sent WhatsApp to {clean_phone} with campaign '{template_name}'")
                    return {
                        "success": True,
                        "simulated": False,
                        "phone": clean_phone,
                        "user_name": user_name,
                        "campaign_name": template_name,
                        "template": template_name,
                        "message": f"WhatsApp delivered successfully to +{clean_phone}",
                        "response": resp_data,
                    }
                else:
                    logger.warning(
                        f"[AiSensy ERROR {status_code}] Failed to send to {clean_phone} (Campaign: '{template_name}'): {resp_data}"
                    )
                    return {
                        "success": False,
                        "simulated": False,
                        "phone": clean_phone,
                        "campaign_name": template_name,
                        "template": template_name,
                        "error": f"AiSensy API error ({status_code}): {resp_data}",
                        "response": resp_data,
                    }
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="ignore") if exc.fp else str(exc)
            logger.error(
                f"[AiSensy HTTP ERROR {exc.code}] Campaign: '{template_name}' | Destination: +{clean_phone} | Response: {err_body}"
            )
            return {
                "success": False,
                "simulated": False,
                "phone": clean_phone,
                "campaign_name": template_name,
                "template": template_name,
                "error": f"AiSensy API HTTP {exc.code} for campaign '{template_name}': {err_body}",
            }
        except urllib.error.URLError as exc:
            logger.error(f"[AiSensy NETWORK ERROR] Exception connecting to {api_url}: {exc.reason}")
            return {
                "success": False,
                "simulated": False,
                "phone": clean_phone,
                "campaign_name": template_name,
                "template": template_name,
                "error": f"Network error communicating with AiSensy: {str(exc.reason)}",
            }
        except Exception as e:
            logger.error(f"[AiSensy UNEXPECTED ERROR] {e}")
            return {
                "success": False,
                "simulated": False,
                "phone": clean_phone,
                "campaign_name": template_name,
                "template": template_name,
                "error": f"Unexpected error: {str(e)}",
            }

    @classmethod
    def send_activity_whatsapp_notifications(
        cls,
        activity: Any,
        specific_customer_index: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Processes a CustomerActivity instance and sends the appropriate WhatsApp
        template message to each customer with a valid phone number.
        
        Supports both multi-customer breakdown records and single customer records.
        """
        results: List[Dict[str, Any]] = []

        branch_name = activity.branch.name if getattr(activity, "branch", None) else "Siri Samruddhi Gold Palace"
        staff_name = activity.employee.full_name if getattr(activity, "employee", None) else "Showroom Staff"

        # Check if breakdown JSON exists
        breakdown_items = []
        if getattr(activity, "breakdown", None):
            try:
                raw = json.loads(activity.breakdown)
                if isinstance(raw, list):
                    breakdown_items = raw
            except Exception:
                breakdown_items = []

        if breakdown_items:
            # Multi-customer breakdown mode
            for idx, item in enumerate(breakdown_items):
                if specific_customer_index is not None and idx != specific_customer_index:
                    continue

                cust_phone = item.get("phone") or item.get("phone_number")
                if not cust_phone or not str(cust_phone).strip():
                    continue

                cust_name = (item.get("name") or item.get("customer_name") or f"Customer #{idx + 1}").strip()
                item_status = item.get("status") or activity.status or "Walkin"
                
                try:
                    p_val = float(item.get("product_value") or 0.0)
                except Exception:
                    p_val = 0.0

                item_notes = item.get("notes") or activity.notes or ""

                campaign_name, camp_key, status_title = cls.get_campaign_config_for_status(item_status)
                media_url = cls.get_media_url_for_status(item_status)
                params = cls.build_template_params(
                    status=item_status,
                    customer_name=cust_name,
                    branch_name=branch_name,
                    employee_name=staff_name,
                    product_value=p_val,
                    notes=item_notes,
                )

                res = cls.send_whatsapp_message(
                    destination=cust_phone,
                    user_name=cust_name,
                    template_name=campaign_name,
                    template_params=params,
                    api_key=camp_key,
                    media_url=media_url,
                )
                res["customer_index"] = idx
                res["customer_name"] = cust_name
                res["status"] = item_status
                res["status_title"] = status_title
                res["campaign_name"] = campaign_name
                results.append(res)
        else:
            # Single customer fallback mode
            cust_phone = getattr(activity, "phone_number", None)
            if cust_phone and str(cust_phone).strip():
                cust_name = getattr(activity, "customer_name", None) or "Customer"
                act_status = getattr(activity, "status", None) or "Walkin"
                p_val = getattr(activity, "product_value", 0.0) or 0.0
                act_notes = getattr(activity, "notes", "") or ""

                campaign_name, camp_key, status_title = cls.get_campaign_config_for_status(act_status)
                media_url = cls.get_media_url_for_status(act_status)
                params = cls.build_template_params(
                    status=act_status,
                    customer_name=cust_name,
                    branch_name=branch_name,
                    employee_name=staff_name,
                    product_value=p_val,
                    notes=act_notes,
                )

                res = cls.send_whatsapp_message(
                    destination=cust_phone,
                    user_name=cust_name,
                    template_name=campaign_name,
                    template_params=params,
                    api_key=camp_key,
                    media_url=media_url,
                )
                res["customer_index"] = 0
                res["customer_name"] = cust_name
                res["status"] = act_status
                res["status_title"] = status_title
                res["campaign_name"] = campaign_name
                results.append(res)

        return results

import os
import zipfile
import json
import logging
from datetime import datetime, date, timezone
import xml.etree.ElementTree as ET
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.models.product import StockProduct
from backend.app.models.activity import CustomerActivity
from backend.app.models.branch import Branch
from backend.app.models.employee import Employee

logger = logging.getLogger("stock_service")


def _safe_float(val: Any) -> float:
    if val is None or val == "":
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def _safe_int(val: Any) -> int:
    if val is None or val == "":
        return 1
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 1


class StockService:
    @staticmethod
    def get_stock_excel_path() -> Optional[str]:
        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "stock full.xlsx"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "stock full.xlsx"),
            "stock full.xlsx",
            "backend/stock full.xlsx",
        ]
        for p in possible_paths:
            if os.path.exists(p):
                return p
        return None

    @classmethod
    def load_stock_excel_if_needed(cls, db: Session, force: bool = False) -> int:
        """
        Loads all products from stock full.xlsx into the database if the table is empty or force=True.
        """
        existing_count = db.query(StockProduct).count()
        if existing_count > 0 and not force:
            logger.info(f"Stock database already initialized with {existing_count} items.")
            return existing_count

        excel_path = cls.get_stock_excel_path()
        if not excel_path:
            logger.warning("stock full.xlsx not found in project directory. Skipping stock load.")
            return existing_count

        logger.info(f"Parsing stock inventory from {excel_path}...")
        t0 = datetime.now()

        try:
            with zipfile.ZipFile(excel_path, "r") as z:
                shared_strings: List[str] = []
                if "xl/sharedStrings.xml" in z.namelist():
                    tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
                    ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                    for si in tree.findall(".//s:si", ns) or tree.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
                        t_elems = si.findall(".//s:t", ns) or si.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                        shared_strings.append("".join([t.text for t in t_elems if t.text]))

                sheet1_xml = "xl/worksheets/sheet1.xml"
                s_tree = ET.fromstring(z.read(sheet1_xml))
                rows = s_tree.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row")

                # Row 1 is Title, Row 2 Subtitle, Row 3 Header. Data starts at row index 3 (Row 4 in Excel)
                items_to_insert = []
                now_dt = datetime.now(timezone.utc)

                for r in rows[3:]:
                    cells = {}
                    for c in r.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                        ref = c.attrib.get("r", "")
                        t_type = c.attrib.get("t", "")
                        v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                        val = v.text if v is not None else ""
                        if t_type == "s" and val.isdigit() and int(val) < len(shared_strings):
                            val = shared_strings[int(val)]
                        col_letter = "".join([ch for ch in ref if ch.isalpha()])
                        cells[col_letter] = val

                    tag_no = (cells.get("B") or "").strip()
                    if not tag_no:
                        continue

                    item_name = (cells.get("C") or "Jewelry Item").strip()
                    item_id = (cells.get("A") or "").strip()
                    sub_item = (cells.get("D") or "").strip()
                    item_type = (cells.get("E") or "").strip()
                    pcs = _safe_int(cells.get("F"))
                    grs_wt = _safe_float(cells.get("G"))
                    net_wt = _safe_float(cells.get("H"))
                    wast_per = _safe_float(cells.get("I"))
                    wastage = _safe_float(cells.get("J"))
                    mc_grm = _safe_float(cells.get("K"))
                    mc = _safe_float(cells.get("L"))
                    rec_date = (cells.get("S") or "").strip()
                    counter = (cells.get("T") or "").strip()
                    size = (cells.get("U") or "").strip()
                    extra_wt = _safe_float(cells.get("V"))

                    items_to_insert.append(
                        StockProduct(
                            tag_no=tag_no,
                            item_id=item_id,
                            item_name=item_name,
                            sub_item=sub_item,
                            item_type=item_type,
                            pcs=pcs,
                            gross_weight=grs_wt,
                            net_weight=net_wt,
                            wastage_percent=wast_per,
                            wastage=wastage,
                            mc_per_gram=mc_grm,
                            making_charges=mc,
                            rec_date=rec_date,
                            counter=counter,
                            size=size,
                            extra_weight=extra_wt,
                            is_sold=False,
                            created_at=now_dt,
                            updated_at=now_dt,
                        )
                    )

                if force:
                    db.query(StockProduct).delete()
                    db.commit()

                # Bulk insert in batches of 3000
                batch_size = 3000
                for i in range(0, len(items_to_insert), batch_size):
                    batch = items_to_insert[i : i + batch_size]
                    db.bulk_save_objects(batch)
                    db.commit()

                duration = (datetime.now() - t0).total_seconds()
                logger.info(f"Loaded {len(items_to_insert)} stock products in {duration:.2f} seconds.")

                # Sync any existing customer activities marked as Sold
                cls.sync_all_existing_sold_activities(db)

                return len(items_to_insert)

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to load stock Excel: {str(e)}", exc_info=True)
            return existing_count

    @classmethod
    def sync_all_existing_sold_activities(cls, db: Session):
        """
        Scans all CustomerActivities and marks corresponding StockProducts as sold.
        """
        try:
            activities = db.query(CustomerActivity).all()
            branches = {b.id: b.code for b in db.query(Branch).all()}
            employees = {e.id: e.full_name for e in db.query(Employee).all()}

            sold_tags_map = {}
            for act in activities:
                b_code = branches.get(act.branch_id, "YELAHANKA")
                emp_name = employees.get(act.employee_id, "Showroom Staff")
                cust_name = act.customer_name or "Walk-in Customer"
                phone = act.phone_number or ""
                s_date = act.activity_date

                # 1. Main activity status
                if act.status in ["Sold", "Exchange"]:
                    if getattr(act, "product_id", None):
                        tag = str(act.product_id).strip()
                        if tag:
                            sold_tags_map[tag] = {
                                "date": s_date,
                                "customer": cust_name,
                                "phone": phone,
                                "value": act.product_value or 0.0,
                                "branch": b_code,
                                "emp_name": emp_name,
                                "act_id": act.id,
                            }

                # 2. Breakdown items
                if act.breakdown:
                    try:
                        items = json.loads(act.breakdown)
                        if isinstance(items, list):
                            for idx, it in enumerate(items):
                                if isinstance(it, dict):
                                    st = it.get("status") or act.status
                                    val = _safe_float(it.get("product_value")) or (act.product_value or 0.0)
                                    tag = (it.get("product_id") or "").strip()
                                    if tag and (st in ["Sold", "Exchange"] or val > 0):
                                        sold_tags_map[tag] = {
                                            "date": s_date,
                                            "customer": it.get("name") or cust_name,
                                            "phone": it.get("phone") or phone,
                                            "value": val,
                                            "branch": b_code,
                                            "emp_name": emp_name,
                                            "act_id": act.id,
                                        }
                    except Exception:
                        pass

            if sold_tags_map:
                for tag, info in sold_tags_map.items():
                    p = db.query(StockProduct).filter(StockProduct.tag_no == tag).first()
                    if p:
                        p.is_sold = True
                        p.sold_date = info["date"]
                        p.sold_customer_name = info["customer"]
                        p.sold_phone = info["phone"]
                        p.sold_value = info["value"]
                        p.sold_branch_code = info["branch"]
                        p.sold_employee_name = info["emp_name"]
                        p.sold_activity_id = info["act_id"]
                db.commit()
                logger.info(f"Synchronized {len(sold_tags_map)} sold items to stock catalog.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing existing sold activities: {e}")

    @classmethod
    def lookup_product(cls, db: Session, tag_no: str) -> Optional[Dict[str, Any]]:
        clean_tag = tag_no.strip()
        if not clean_tag:
            return None

        p = db.query(StockProduct).filter(StockProduct.tag_no == clean_tag).first()
        if not p:
            # Fallback to case-insensitive match
            p = db.query(StockProduct).filter(StockProduct.tag_no.ilike(clean_tag)).first()

        if not p:
            return None

        return {
            "id": p.id,
            "tag_no": p.tag_no,
            "item_id": p.item_id,
            "item_name": p.item_name,
            "sub_item": p.sub_item,
            "item_type": p.item_type,
            "pcs": p.pcs,
            "gross_weight": p.gross_weight,
            "net_weight": p.net_weight,
            "wastage_percent": p.wastage_percent,
            "wastage": p.wastage,
            "mc_per_gram": p.mc_per_gram,
            "making_charges": p.making_charges,
            "counter": p.counter,
            "size": p.size,
            "rec_date": p.rec_date,
            "is_sold": p.is_sold,
            "sold_date": p.sold_date.isoformat() if p.sold_date else None,
            "sold_customer_name": p.sold_customer_name,
            "sold_value": p.sold_value,
            "sold_branch_code": p.sold_branch_code,
        }

    @classmethod
    def search_products(cls, db: Session, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        clean = query.strip()
        if not clean:
            return []

        # Match by tag number prefix or full match first, then by name
        results = (
            db.query(StockProduct)
            .filter(
                or_(
                    StockProduct.tag_no.like(f"{clean}%"),
                    StockProduct.tag_no.ilike(f"%{clean}%"),
                    StockProduct.item_name.ilike(f"%{clean}%"),
                )
            )
            .limit(limit)
            .all()
        )

        return [
            {
                "id": p.id,
                "tag_no": p.tag_no,
                "item_name": p.item_name,
                "item_type": p.item_type,
                "gross_weight": p.gross_weight,
                "net_weight": p.net_weight,
                "pcs": p.pcs,
                "making_charges": p.making_charges,
                "counter": p.counter,
                "is_sold": p.is_sold,
            }
            for p in results
        ]

    @classmethod
    def sync_activity_sold_products(cls, db: Session, activity: CustomerActivity):
        """
        Triggered when a CustomerActivity is created or updated.
        Updates stock_products so sold tag numbers are automatically flagged as is_sold=True.
        """
        try:
            branch = db.query(Branch).filter(Branch.id == activity.branch_id).first()
            emp = db.query(Employee).filter(Employee.id == activity.employee_id).first()
            branch_code = branch.code if branch else "YELAHANKA"
            emp_name = emp.full_name if emp else "Showroom Staff"

            tags_in_this_activity = []

            # 1. Main activity product_id if sold
            if activity.status in ["Sold", "Exchange"]:
                main_tag = getattr(activity, "product_id", None)
                if main_tag:
                    tags_in_this_activity.append({
                        "tag": str(main_tag).strip(),
                        "customer": activity.customer_name or "Walk-in Customer",
                        "phone": activity.phone_number or "",
                        "value": activity.product_value or 0.0,
                    })

            # 2. Breakdown products
            if activity.breakdown:
                try:
                    items = json.loads(activity.breakdown)
                    if isinstance(items, list):
                        for it in items:
                            if isinstance(it, dict):
                                st = it.get("status") or activity.status
                                val = _safe_float(it.get("product_value")) or (activity.product_value or 0.0)
                                tag = (it.get("product_id") or "").strip()
                                if tag and (st in ["Sold", "Exchange"] or val > 0):
                                    tags_in_this_activity.append({
                                        "tag": tag,
                                        "customer": it.get("name") or activity.customer_name or "Customer",
                                        "phone": it.get("phone") or activity.phone_number or "",
                                        "value": val,
                                    })
                except Exception:
                    pass

            # Mark products as sold
            for item in tags_in_this_activity:
                p = db.query(StockProduct).filter(StockProduct.tag_no == item["tag"]).first()
                if p:
                    p.is_sold = True
                    p.sold_date = activity.activity_date
                    p.sold_customer_name = item["customer"]
                    p.sold_phone = item["phone"]
                    p.sold_value = item["value"]
                    p.sold_branch_code = branch_code
                    p.sold_employee_name = emp_name
                    p.sold_activity_id = activity.id

            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing activity sold products: {e}")

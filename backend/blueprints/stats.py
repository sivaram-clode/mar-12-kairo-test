from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from models import db, QRCode, Scan

stats_bp = Blueprint("stats", __name__, url_prefix="/api/qr")


def _check_ownership(qr: QRCode, user_id: int, claims: dict):
    if claims.get("role") == "admin":
        return True
    return qr.user_id == user_id


@stats_bp.get("/<int:qr_id>/stats")
@jwt_required()
def qr_stats(qr_id: int):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    qr = QRCode.query.get_or_404(qr_id)
    if not _check_ownership(qr, user_id, claims):
        return jsonify({"error": "forbidden", "code": 403}), 403

    total_scans = Scan.query.filter_by(qr_code_id=qr_id).count()

    # Scans per day for the last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    # func.date() works on both PostgreSQL and SQLite
    day_expr = func.date(Scan.scanned_at)
    daily = (
        db.session.query(
            day_expr.label("day"),
            func.count(Scan.id).label("count"),
        )
        .filter(Scan.qr_code_id == qr_id, Scan.scanned_at >= thirty_days_ago)
        .group_by(day_expr)
        .order_by(day_expr)
        .all()
    )

    recent_scans = (
        Scan.query.filter_by(qr_code_id=qr_id)
        .order_by(Scan.scanned_at.desc())
        .limit(10)
        .all()
    )

    return jsonify(
        {
            "qr_code": qr.to_dict(),
            "total_scans": total_scans,
            "daily_scans_last_30d": [
                {"day": str(row.day), "count": row.count} for row in daily
            ],
            "recent_scans": [s.to_dict() for s in recent_scans],
        }
    ), 200

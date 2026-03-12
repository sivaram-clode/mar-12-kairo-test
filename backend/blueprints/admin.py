from datetime import datetime, timezone, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt

from models import db, User, QRCode, Scan

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        from flask import abort
        abort(403)


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    _require_admin()
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route("/users/<int:user_id>", methods=["PATCH"])
@jwt_required()
def update_user(user_id: int):
    _require_admin()
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/qr", methods=["GET"])
@jwt_required()
def list_all_qr():
    _require_admin()
    qrs = QRCode.query.order_by(QRCode.created_at.desc()).all()
    return jsonify([q.to_dict() for q in qrs]), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def admin_stats():
    _require_admin()

    total_users = User.query.count()
    total_qrs = QRCode.query.count()
    total_scans = Scan.query.count()

    now = datetime.now(timezone.utc)
    daily_scans = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = Scan.query.filter(
            Scan.scanned_at >= day_start,
            Scan.scanned_at < day_end,
        ).count()
        daily_scans.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count,
        })

    return jsonify({
        "total_users": total_users,
        "total_qr_codes": total_qrs,
        "total_scans": total_scans,
        "daily_scans_last_30_days": daily_scans,
    }), 200

import os
from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

import qrcode as qrcode_lib
from qrcode.image.pil import PilImage

from models import db, User, QRCode, Scan

qr_bp = Blueprint("qr", __name__, url_prefix="/api/qr")


def _current_user() -> User:
    return User.query.get(int(get_jwt_identity()))


def _is_admin() -> bool:
    return get_jwt().get("role") == "admin"


def _qr_image_path(app, code: str) -> str:
    qr_dir = os.path.join(app.root_path, "static", "qr")
    os.makedirs(qr_dir, exist_ok=True)
    return os.path.join(qr_dir, f"{code}.png")


@qr_bp.route("/", methods=["POST"])
@qr_bp.route("", methods=["POST"])
@jwt_required()
def create_qr():
    user = _current_user()
    data = request.get_json(silent=True) or {}
    destination_url = data.get("destination_url", "").strip()
    label = data.get("label", "").strip() or None

    if not destination_url:
        return jsonify({"error": "destination_url is required"}), 400

    qr = QRCode(user_id=user.id, destination_url=destination_url, label=label)
    db.session.add(qr)
    db.session.flush()  # get qr.id and qr.code

    redirect_url = f"{current_app.config.get('BASE_URL', 'http://localhost:5000')}/r/{qr.code}"

    # Generate PNG
    img = qrcode_lib.make(redirect_url)
    img_path = _qr_image_path(current_app, qr.code)
    img.save(img_path)

    db.session.commit()
    return jsonify(qr.to_dict()), 201


@qr_bp.route("/", methods=["GET"])
@qr_bp.route("", methods=["GET"])
@jwt_required()
def list_qr():
    user = _current_user()
    if _is_admin():
        qrs = QRCode.query.order_by(QRCode.created_at.desc()).all()
    else:
        qrs = QRCode.query.filter_by(user_id=user.id).order_by(QRCode.created_at.desc()).all()
    return jsonify([q.to_dict() for q in qrs]), 200


@qr_bp.route("/<int:qr_id>", methods=["GET"])
@jwt_required()
def get_qr(qr_id: int):
    user = _current_user()
    qr = QRCode.query.get(qr_id)
    if not qr:
        abort(404)
    if not _is_admin() and qr.user_id != user.id:
        abort(403)
    return jsonify(qr.to_dict()), 200


@qr_bp.route("/<int:qr_id>", methods=["PATCH"])
@jwt_required()
def update_qr(qr_id: int):
    user = _current_user()
    qr = QRCode.query.get(qr_id)
    if not qr:
        abort(404)
    if not _is_admin() and qr.user_id != user.id:
        abort(403)

    data = request.get_json(silent=True) or {}

    if "destination_url" in data:
        new_url = data["destination_url"].strip()
        if not new_url:
            return jsonify({"error": "destination_url cannot be empty"}), 400
        qr.destination_url = new_url

    if "label" in data:
        qr.label = data["label"] or None

    if "is_active" in data:
        qr.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify(qr.to_dict()), 200


@qr_bp.route("/<int:qr_id>", methods=["DELETE"])
@jwt_required()
def delete_qr(qr_id: int):
    user = _current_user()
    qr = QRCode.query.get(qr_id)
    if not qr:
        abort(404)
    if not _is_admin() and qr.user_id != user.id:
        abort(403)
    db.session.delete(qr)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@qr_bp.route("/<int:qr_id>/stats", methods=["GET"])
@jwt_required()
def qr_stats(qr_id: int):
    user = _current_user()
    qr = QRCode.query.get(qr_id)
    if not qr:
        abort(404)
    if not _is_admin() and qr.user_id != user.id:
        abort(403)

    total_scans = Scan.query.filter_by(qr_code_id=qr.id).count()

    now = datetime.now(timezone.utc)

    # Last 30 days daily breakdown
    daily_scans_last_30d = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = Scan.query.filter(
            Scan.qr_code_id == qr.id,
            Scan.scanned_at >= day_start,
            Scan.scanned_at < day_end,
        ).count()
        daily_scans_last_30d.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count,
        })

    # Recent scans (last 10)
    recent_scans = (
        Scan.query.filter_by(qr_code_id=qr.id)
        .order_by(Scan.scanned_at.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        "qr_code": qr.to_dict(),
        "total_scans": total_scans,
        "daily_scans_last_30d": daily_scans_last_30d,
        "recent_scans": [s.to_dict() for s in recent_scans],
    }), 200

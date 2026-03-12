import os
import io
import uuid
import qrcode
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, QRCode, User

qr_bp = Blueprint("qr_codes", __name__, url_prefix="/api/qr")


def _require_qr_owner_or_admin(qr: QRCode, user_id: int, claims: dict):
    if claims.get("role") == "admin":
        return True
    return qr.user_id == user_id


def _generate_qr_image(redirect_url: str, code: str, app) -> str:
    """Generate PNG, save to disk, return relative path."""
    qr_dir = os.path.join(app.root_path, app.config["QR_CODES_DIR"])
    os.makedirs(qr_dir, exist_ok=True)
    filename = f"{code}.png"
    filepath = os.path.join(qr_dir, filename)

    img = qrcode.make(redirect_url)
    img.save(filepath)
    return os.path.join(app.config["QR_CODES_DIR"], filename)


@qr_bp.post("/")
@jwt_required()
def create_qr():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    dest = data.get("destination_url", "").strip()
    if not dest:
        return jsonify({"error": "destination_url is required", "code": 400}), 400

    code = str(uuid.uuid4())
    redirect_url = f"{current_app.config['BASE_URL']}/r/{code}"

    image_path = None
    try:
        image_path = _generate_qr_image(redirect_url, code, current_app._get_current_object())
    except Exception as exc:
        current_app.logger.warning(f"QR image generation failed: {exc}")

    qr = QRCode(
        code=code,
        label=data.get("label"),
        destination_url=dest,
        image_path=image_path,
        user_id=user_id,
    )
    db.session.add(qr)
    db.session.commit()
    return jsonify(qr.to_dict()), 201


@qr_bp.get("/")
@jwt_required()
def list_qr():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get("role") == "admin":
        qrs = QRCode.query.order_by(QRCode.created_at.desc()).all()
    else:
        qrs = QRCode.query.filter_by(user_id=user_id).order_by(QRCode.created_at.desc()).all()
    return jsonify([q.to_dict() for q in qrs]), 200


@qr_bp.get("/<int:qr_id>")
@jwt_required()
def get_qr(qr_id: int):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    qr = QRCode.query.get_or_404(qr_id)
    if not _require_qr_owner_or_admin(qr, user_id, claims):
        return jsonify({"error": "forbidden", "code": 403}), 403
    return jsonify(qr.to_dict()), 200


@qr_bp.patch("/<int:qr_id>")
@jwt_required()
def update_qr(qr_id: int):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    qr = QRCode.query.get_or_404(qr_id)
    if not _require_qr_owner_or_admin(qr, user_id, claims):
        return jsonify({"error": "forbidden", "code": 403}), 403

    data = request.get_json(silent=True) or {}
    if "destination_url" in data:
        dest = data["destination_url"].strip()
        if not dest:
            return jsonify({"error": "destination_url cannot be empty", "code": 400}), 400
        qr.destination_url = dest
    if "label" in data:
        qr.label = data["label"]
    if "is_active" in data:
        qr.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify(qr.to_dict()), 200


@qr_bp.delete("/<int:qr_id>")
@jwt_required()
def delete_qr(qr_id: int):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    qr = QRCode.query.get_or_404(qr_id)
    if not _require_qr_owner_or_admin(qr, user_id, claims):
        return jsonify({"error": "forbidden", "code": 403}), 403

    # Remove image file if present
    if qr.image_path:
        try:
            full = os.path.join(current_app.root_path, qr.image_path)
            if os.path.exists(full):
                os.remove(full)
        except Exception:
            pass

    db.session.delete(qr)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@qr_bp.get("/<int:qr_id>/image")
@jwt_required()
def get_qr_image(qr_id: int):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    qr = QRCode.query.get_or_404(qr_id)
    if not _require_qr_owner_or_admin(qr, user_id, claims):
        return jsonify({"error": "forbidden", "code": 403}), 403
    if not qr.image_path:
        return jsonify({"error": "no image available", "code": 404}), 404
    full = os.path.join(current_app.root_path, qr.image_path)
    if not os.path.exists(full):
        return jsonify({"error": "image file not found", "code": 404}), 404
    return send_file(full, mimetype="image/png")

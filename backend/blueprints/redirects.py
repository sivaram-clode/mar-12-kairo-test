from flask import Blueprint, redirect, request, jsonify
from models import db, QRCode, Scan

redirect_bp = Blueprint("redirects", __name__)


@redirect_bp.get("/r/<string:code>")
def scan_and_redirect(code: str):
    qr = QRCode.query.filter_by(code=code, is_active=True).first()
    if not qr:
        return jsonify({"error": "QR code not found or inactive", "code": 404}), 404

    scan = Scan(
        qr_code_id=qr.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
        referer=request.headers.get("Referer"),
    )
    db.session.add(scan)
    db.session.commit()

    return redirect(qr.destination_url, code=302)

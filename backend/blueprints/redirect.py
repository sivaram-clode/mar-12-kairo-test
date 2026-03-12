from datetime import datetime, timezone

from flask import Blueprint, redirect, request, abort
from models import db, QRCode, Scan

redirect_bp = Blueprint("redirect", __name__)


@redirect_bp.route("/r/<string:code>")
def handle_redirect(code: str):
    qr = QRCode.query.filter_by(code=code, is_active=True).first()
    if not qr:
        abort(404)

    scan = Scan(
        qr_code_id=qr.id,
        scanned_at=datetime.now(timezone.utc),
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    db.session.add(scan)
    db.session.commit()

    return redirect(qr.destination_url, code=302)

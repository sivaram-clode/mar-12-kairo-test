from datetime import datetime, timezone
from .base import db


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    qr_code_id = db.Column(
        db.Integer,
        db.ForeignKey("qr_codes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ip_address = db.Column(db.String(45), nullable=True)   # IPv4 or IPv6
    user_agent = db.Column(db.Text, nullable=True)
    referer = db.Column(db.Text, nullable=True)
    scanned_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "qr_code_id": self.qr_code_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "referer": self.referer,
            "scanned_at": self.scanned_at.isoformat() if self.scanned_at else None,
        }

    def __repr__(self) -> str:
        return f"<Scan {self.id} qr={self.qr_code_id} at={self.scanned_at}>"

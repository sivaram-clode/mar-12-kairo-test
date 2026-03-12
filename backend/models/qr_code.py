import uuid
from datetime import datetime, timezone
from .base import db


class QRCode(db.Model):
    __tablename__ = "qr_codes"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    label = db.Column(db.String(255), nullable=True)
    destination_url = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(512), nullable=True)  # relative path to PNG
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    scans = db.relationship("Scan", backref="qr_code", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "code": self.code,
            "label": self.label,
            "destination_url": self.destination_url,
            "image_path": self.image_path,
            "user_id": self.user_id,
            "is_active": self.is_active,
            "scan_count": self.scans.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<QRCode {self.code} -> {self.destination_url}>"

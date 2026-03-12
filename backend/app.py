import os
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from models import db
from config import config_map


def create_app(config_name: str = None) -> Flask:
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # Extensions
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    )

    @app.before_request
    def handle_preflight():
        from flask import request, make_response
        if request.method == "OPTIONS":
            res = make_response()
            res.headers["Access-Control-Allow-Origin"] = "*"
            res.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, PUT, DELETE, OPTIONS"
            res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            res.headers["Access-Control-Max-Age"] = "3600"
            return res, 204

    # Blueprints
    from blueprints.auth import auth_bp
    from blueprints.qr_codes import qr_bp
    from blueprints.redirects import redirect_bp
    from blueprints.stats import stats_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(qr_bp)
    app.register_blueprint(redirect_bp)
    app.register_blueprint(stats_bp)

    # Ensure QR code directory exists
    qr_dir = os.path.join(app.root_path, app.config["QR_CODES_DIR"])
    os.makedirs(qr_dir, exist_ok=True)

    # Auto-create tables in development (for SQLite)
    with app.app_context():
        db.create_all()

    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

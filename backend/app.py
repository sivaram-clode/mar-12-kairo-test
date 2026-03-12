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
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

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

    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

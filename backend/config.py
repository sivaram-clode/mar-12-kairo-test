import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    QR_CODES_DIR = os.environ.get("QR_CODES_DIR", "static/qrcodes")
    BASE_URL = os.environ.get("BASE_URL", "http://localhost:5000")


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://localhost/qr_platform"
    )


class TestingConfig(Config):
    TESTING = True
    # Use SQLite in-memory for tests when TEST_DATABASE_URL is not set
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TEST_DATABASE_URL", "sqlite:///:memory:"
    )
    JWT_SECRET_KEY = "test-jwt-secret"
    SECRET_KEY = "test-secret"
    QR_CODES_DIR = "/tmp/test_qrcodes"
    BASE_URL = "http://localhost"


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")


config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}

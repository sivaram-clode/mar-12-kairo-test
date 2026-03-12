import os
import pytest
from app import create_app
from models import db as _db


@pytest.fixture(scope="session")
def app():
    os.environ["FLASK_ENV"] = "testing"
    _app = create_app("testing")
    ctx = _app.app_context()
    ctx.push()
    _db.create_all()
    yield _app
    _db.drop_all()
    ctx.pop()


@pytest.fixture(scope="function")
def client(app):
    with app.test_client() as c:
        yield c


@pytest.fixture(scope="function", autouse=True)
def clean_db(app):
    """Truncate tables between tests."""
    yield
    _db.session.remove()
    for table in reversed(_db.metadata.sorted_tables):
        _db.session.execute(table.delete())
    _db.session.commit()

import os

# Keep tests off the developer's local jolly.db.
os.environ.setdefault("DATABASE_URL", "sqlite://")

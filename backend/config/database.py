from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.settings import get_settings
from loguru import logger

settings = get_settings()

# Debug: Log the DATABASE_URL (without sensitive info)
try:
    if '@' in settings.DATABASE_URL:
        url_parts = settings.DATABASE_URL.split('@')
        masked_url = settings.DATABASE_URL.replace(url_parts[0].split('//')[1], '***:***')
    else:
        masked_url = settings.DATABASE_URL
    logger.info(f"Using DATABASE_URL: {masked_url}")
except Exception as e:
    logger.warning(f"Could not mask DATABASE_URL for logging: {e}")
    logger.info("DATABASE_URL is configured")

# Create database engine with error handling
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,  # Reduced for Railway
        max_overflow=10,  # Reduced for Railway
        connect_args={"sslmode": "require"} if "railway" in settings.DATABASE_URL else {}
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
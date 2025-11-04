from sqlalchemy import create_engine, text
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

# Create database engine with error handling and fallback
try:
    # Different configs for different database types
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}  # Required for SQLite
        )
        logger.info("Using SQLite database")
    else:
        # Try PostgreSQL first
        try:
            engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=3,  # Reduced for Railway
                max_overflow=5,  # Reduced for Railway
                pool_timeout=10,  # Add timeout
                pool_recycle=3600,  # Recycle connections every hour
                connect_args={
                    "sslmode": "require",
                    "connect_timeout": 10
                } if "railway" in settings.DATABASE_URL else {}
            )
            # Test the connection immediately
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("PostgreSQL connection successful")
        except Exception as pg_error:
            logger.error(f"PostgreSQL connection failed: {pg_error}")
            logger.warning("Falling back to SQLite for Railway deployment")
            # Fallback to SQLite for Railway if PostgreSQL fails
            fallback_url = "sqlite:///./whop_lead_engine.db"
            engine = create_engine(
                fallback_url,
                connect_args={"check_same_thread": False}
            )
            logger.info("Using SQLite fallback database")
    
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
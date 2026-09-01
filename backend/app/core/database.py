import logging
from sqlalchemy import create_engine, text, inspect, event
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

logger = logging.getLogger("database")

def create_db_engine():
    """Create a database engine with PostgreSQL support and graceful SQLite fallback."""
    db_url = settings.DATABASE_URL
    connect_args = {}
    
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False, "timeout": 60}
        return create_engine(
            db_url,
            connect_args=connect_args,
            echo=(settings.ENVIRONMENT == "development" and settings.LOG_LEVEL == "DEBUG"),
            future=True,
        )
    
    # PostgreSQL configuration
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=(settings.ENVIRONMENT == "development" and settings.LOG_LEVEL == "DEBUG"),
            future=True,
        )
        # Verify connection test
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected successfully to PostgreSQL database: {db_url}")
        return engine
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite database at {settings.SQLITE_FALLBACK_URL}...")
        fallback_url = getattr(settings, "SQLITE_FALLBACK_URL", "sqlite:///./database.db")
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False, "timeout": 60},
            echo=False,
            future=True,
        )

engine = create_db_engine()

# Enable WAL mode and 30-second busy timeout for concurrent read/write across multiple showroom managers
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(engine.url):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def auto_migrate_db_schema():
    """
    Automatically inspects database tables against Base metadata models and
    adds any missing columns dynamically. Prevents schema mismatch errors
    between SQLite and PostgreSQL.
    """
    # Import all models to ensure metadata is populated
    from backend.app.models.branch import Branch, User
    from backend.app.models.employee import Employee
    from backend.app.models.activity import CustomerActivity, SchemeRecord, EmployeeFormMedia, GoogleReview, AttireRecord
    from backend.app.models.outdoor_marketing import OutdoorMarketingArea, OutdoorMarketingDuty, OutdoorMarketingCustomer, OutdoorMarketingScheme, OutdoorMarketingActivity
    from backend.app.models.audit import AuditLog

    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)

    with engine.connect() as conn:
        # If SQLite, check if users.branch_id or users.email has NOT NULL constraint and fix it
        if engine.dialect.name == "sqlite" and "users" in inspector.get_table_names():
            try:
                user_cols = inspector.get_columns("users")
                branch_col = next((c for c in user_cols if c['name'].lower() == 'branch_id'), None)
                email_col = next((c for c in user_cols if c['name'].lower() == 'email'), None)
                
                needs_fix = False
                if branch_col and not branch_col.get('nullable', True):
                    needs_fix = True
                if email_col and not email_col.get('nullable', True):
                    needs_fix = True

                if needs_fix:
                    logger.info("Fixing SQLite users table constraints (making branch_id & email nullable)...")
                    conn.execute(text("PRAGMA foreign_keys = OFF"))
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS users_temp_fix (
                            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                            branch_id INTEGER,
                            email VARCHAR(100),
                            username VARCHAR(100) NOT NULL,
                            hashed_password VARCHAR(255) NOT NULL,
                            full_name VARCHAR(100) NOT NULL,
                            role VARCHAR(50) NOT NULL,
                            is_active BOOLEAN NOT NULL DEFAULT 1,
                            last_login DATETIME,
                            created_at DATETIME NOT NULL,
                            updated_at DATETIME NOT NULL,
                            FOREIGN KEY(branch_id) REFERENCES branches (id)
                        )
                    """))
                    conn.execute(text("""
                        INSERT INTO users_temp_fix (id, branch_id, email, username, hashed_password, full_name, role, is_active, last_login, created_at, updated_at)
                        SELECT id, branch_id, email, username, hashed_password, full_name, role, is_active, last_login, created_at, updated_at FROM users
                    """))
                    conn.execute(text("DROP TABLE users"))
                    conn.execute(text("ALTER TABLE users_temp_fix RENAME TO users"))
                    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)"))
                    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_branch_id ON users (branch_id)"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)"))
                    conn.execute(text("PRAGMA foreign_keys = ON"))
                    conn.commit()
                    logger.info("Successfully updated users table in SQLite (branch_id & email nullable).")
            except Exception as e:
                logger.warning(f"Note on SQLite users schema fix: {e}")

        for table_name, table in Base.metadata.tables.items():
            if table_name in inspector.get_table_names():
                existing_cols = {c['name'].lower() for c in inspector.get_columns(table_name)}
                for col in table.columns:
                    if col.name.lower() not in existing_cols:
                        col_type = col.type.compile(engine.dialect)
                        logger.info(f"Auto-migrating missing column {col.name} ({col_type}) to table {table_name}")
                        try:
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type}"))
                            conn.commit()
                        except Exception as e:
                            logger.warning(f"Column migration warning for {table_name}.{col.name}: {e}")


def get_db():
    """Dependency generator for database sessions with automatic commit/rollback/close."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

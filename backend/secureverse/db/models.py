from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime, Index, Integer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import uuid, datetime
from secureverse.config import settings

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    did:             Mapped[str]                     = mapped_column(String(256), primary_key=True)
    totp_secret:     Mapped[str]                     = mapped_column(String(64))
    role:            Mapped[str]                     = mapped_column(String(32), default="user")
    failed_attempts: Mapped[int]                     = mapped_column(Integer, default=0)
    locked_until:    Mapped[datetime.datetime | None]= mapped_column(DateTime(timezone=True), nullable=True)
    created_at:      Mapped[datetime.datetime]       = mapped_column(
                       DateTime(timezone=True),
                       default=lambda: datetime.datetime.now(datetime.timezone.utc))

class AuditEntry(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        Index("ix_audit_user_did", "user_did"),
        Index("ix_audit_timestamp", "timestamp"),
    )
    id:         Mapped[str]               = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_did:   Mapped[str]               = mapped_column(String(256))
    action:     Mapped[str]               = mapped_column(String(128))
    timestamp:  Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    hmac_chain: Mapped[str]               = mapped_column(String(64))
    prev_hmac:  Mapped[str]               = mapped_column(String(64))
    details:    Mapped[str | None]        = mapped_column(String(512), nullable=True)

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
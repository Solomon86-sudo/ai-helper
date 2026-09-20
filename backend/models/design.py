import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Enum, String, Integer, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database.db import Base


class SpecType(enum.Enum):
    general_tz = "general_tz"
    private_tz = "private_tz"


class SpecStatus(enum.Enum):
    draft = "draft"
    review = "review"
    approved = "approved"


class DisciplineType(enum.Enum):
    AR = "AR"
    KR = "KR"
    OV = "OV"
    VK = "VK"
    EOM = "EOM"
    SS = "SS"
    POS = "POS"


class RDStatus(enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    submitted = "submitted"
    accepted = "accepted"
    in_production = "in_production"


class CommentSeverity(enum.Enum):
    critical = "critical"
    major = "major"
    minor = "minor"


class CommentStatus(enum.Enum):
    open = "open"
    resolved = "resolved"
    rejected = "rejected"


class DesignSpec(Base):
    """Модель задания на проектирование."""
    __tablename__ = "design_specs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    spec_type: Mapped[SpecType] = mapped_column(Enum(SpecType))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[SpecStatus] = mapped_column(Enum(SpecStatus), default=SpecStatus.draft)
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class RDVolume(Base):
    """Модель тома рабочей документации (РД)."""
    __tablename__ = "rd_volumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    tome_number: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(255))
    discipline: Mapped[DisciplineType] = mapped_column(Enum(DisciplineType))
    status: Mapped[RDStatus] = mapped_column(Enum(RDStatus), default=RDStatus.not_started)
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    revision: Mapped[int] = mapped_column(Integer, default=0)
    accepted_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    stamp_in_production: Mapped[bool] = mapped_column(Boolean, default=False)


class ReviewComment(Base):
    """Модель замечания к РД."""
    __tablename__ = "review_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    rd_volume_id: Mapped[int] = mapped_column(ForeignKey("rd_volumes.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    comment_text: Mapped[str] = mapped_column(Text)
    severity: Mapped[CommentSeverity] = mapped_column(Enum(CommentSeverity))
    status: Mapped[CommentStatus] = mapped_column(Enum(CommentStatus), default=CommentStatus.open)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

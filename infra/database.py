import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://indus_user:indus_secure_pass@postgres_db:5432/indus_brain")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    role = Column(String(50), nullable=False) # Admin, Engineer, Analyst, Operator
    created_at = Column(DateTime, default=datetime.utcnow)

class DBTelemetryIncident(Base):
    __tablename__ = "telemetry_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    telemetry_id = Column(String(50), nullable=False, index=True)
    alert_message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False) # High, Critical, Medium, Low
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Store the resolved trace from the multi-agent execution loop
    agent_assessment = Column(Text, nullable=True)

class DBAuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(200), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
try:
    from geoalchemy2 import Geometry
except ImportError:
    Geometry = None
from app.database.session import Base
class Area(Base):
    __tablename__='areas'
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]=mapped_column(String(160), index=True)
    ward: Mapped[str]=mapped_column(String(80), index=True)
    zone: Mapped[str]=mapped_column(String(120), index=True)
    latitude: Mapped[float]=mapped_column(Float)
    longitude: Mapped[float]=mapped_column(Float)
    population: Mapped[int]=mapped_column(Integer, default=0)
    households: Mapped[int]=mapped_column(Integer, default=0)
    elevation_m: Mapped[float]=mapped_column(Float, default=0)
    geom = mapped_column(Geometry('POINT', srid=4326) if Geometry else Text, nullable=True)
    __table_args__=(Index('ix_areas_geom','geom',postgresql_using='gist'),)
class Hazard(Base):
    __tablename__='hazards'
    id: Mapped[int]=mapped_column(primary_key=True)
    area_id: Mapped[int]=mapped_column(index=True)
    hazard_type: Mapped[str]=mapped_column(String(80), index=True)
    hazard_score: Mapped[float]=mapped_column(Float)
    exposure_score: Mapped[float]=mapped_column(Float)
    confidence: Mapped[float]=mapped_column(Float, default=0.7)
    source: Mapped[str]=mapped_column(String(255))
    last_updated: Mapped[datetime|None]=mapped_column(DateTime, nullable=True)
class Shelter(Base):
    __tablename__='shelters'
    id: Mapped[int]=mapped_column(primary_key=True)
    external_id: Mapped[str]=mapped_column(String(80), unique=True)
    name: Mapped[str]=mapped_column(String(255))
    facility_type: Mapped[str]=mapped_column(String(120))
    area: Mapped[str]=mapped_column(String(160), default='')
    zone: Mapped[str]=mapped_column(String(120), default='')
    ward: Mapped[str]=mapped_column(String(80), default='')
    latitude: Mapped[float|None]=mapped_column(Float, nullable=True)
    longitude: Mapped[float|None]=mapped_column(Float, nullable=True)
    capacity: Mapped[int]=mapped_column(Integer, default=0)
    status: Mapped[str]=mapped_column(String(80), default='Unknown')
class Resource(Base):
    __tablename__='resources'
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]=mapped_column(String(255))
    resource_type: Mapped[str]=mapped_column(String(120))
    area: Mapped[str]=mapped_column(String(160), default='')
    zone: Mapped[str]=mapped_column(String(120), default='')
    latitude: Mapped[float|None]=mapped_column(Float, nullable=True)
    longitude: Mapped[float|None]=mapped_column(Float, nullable=True)
    capacity: Mapped[int]=mapped_column(Integer, default=0)
    status: Mapped[str]=mapped_column(String(80), default='Unknown')
class RiskAssessment(Base):
    __tablename__='risk_assessments'
    id: Mapped[int]=mapped_column(primary_key=True)
    area_id: Mapped[int]=mapped_column(index=True)
    hazard_exposure: Mapped[float]=mapped_column(Float)
    population_exposure: Mapped[float]=mapped_column(Float)
    vulnerability: Mapped[float]=mapped_column(Float)
    capacity_deficit: Mapped[float]=mapped_column(Float)
    accessibility_risk: Mapped[float]=mapped_column(Float)
    score: Mapped[float]=mapped_column(Float)
    level: Mapped[str]=mapped_column(String(30))
class CapacityAssessment(Base):
    __tablename__='capacity_assessments'
    id: Mapped[int]=mapped_column(primary_key=True)
    area_id: Mapped[int]=mapped_column(index=True)
    available_capacity: Mapped[float]=mapped_column(Float)
    required_capacity: Mapped[float]=mapped_column(Float)
    deficit: Mapped[float]=mapped_column(Float)
    ratio: Mapped[float]=mapped_column(Float)
    level: Mapped[str]=mapped_column(String(30))
class RelocationPriority(Base):
    __tablename__='relocation_priorities'
    id: Mapped[int]=mapped_column(primary_key=True)
    area_id: Mapped[int]=mapped_column(index=True)
    score: Mapped[float]=mapped_column(Float)
    level: Mapped[str]=mapped_column(String(30))
    recommended_action: Mapped[str]=mapped_column(Text)
class DataSource(Base):
    __tablename__='data_sources'
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]=mapped_column(String(255))
    description: Mapped[str]=mapped_column(Text)
    data_type: Mapped[str]=mapped_column(String(80))
    coverage: Mapped[str]=mapped_column(String(255))
    source_url: Mapped[str]=mapped_column(Text)
    retrieved_at: Mapped[str]=mapped_column(String(50), default='')
    confidence: Mapped[float]=mapped_column(Float, default=.7)
class User(Base):
    __tablename__='users'; id: Mapped[int]=mapped_column(primary_key=True); username: Mapped[str]=mapped_column(String(120),unique=True); role: Mapped[str]=mapped_column(String(30),default='Viewer')
class District(Base):
    __tablename__='districts'; id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(120),unique=True)
class Zone(Base):
    __tablename__='zones'; id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(120),unique=True)
class Ward(Base):
    __tablename__='wards'; id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(120),unique=True); zone: Mapped[str]=mapped_column(String(120))
class Population(Base):
    __tablename__='population'; id: Mapped[int]=mapped_column(primary_key=True); area_id: Mapped[int]=mapped_column(index=True); total: Mapped[int]=mapped_column(Integer); children: Mapped[int]=mapped_column(Integer,default=0); elderly: Mapped[int]=mapped_column(Integer,default=0); assistance_required: Mapped[int]=mapped_column(Integer,default=0)
class Household(Base):
    __tablename__='households'; id: Mapped[int]=mapped_column(primary_key=True); area_id: Mapped[int]=mapped_column(index=True); total: Mapped[int]=mapped_column(Integer)
class VulnerabilityAssessment(Base):
    __tablename__='vulnerability_assessments'; id: Mapped[int]=mapped_column(primary_key=True); area_id: Mapped[int]=mapped_column(index=True); score: Mapped[float]=mapped_column(Float); accessibility_score: Mapped[float]=mapped_column(Float); infrastructure_score: Mapped[float]=mapped_column(Float)
class HazardObservation(Base):
    __tablename__='hazard_observations'; id: Mapped[int]=mapped_column(primary_key=True); hazard_id: Mapped[int]=mapped_column(index=True); observed_value: Mapped[float]=mapped_column(Float); source: Mapped[str]=mapped_column(String(255))
class SafeArea(Base):
    __tablename__='safe_areas'; id: Mapped[int]=mapped_column(primary_key=True); area_id: Mapped[int]=mapped_column(index=True); suitability_score: Mapped[float]=mapped_column(Float); available_capacity: Mapped[float]=mapped_column(Float); distance_km: Mapped[float]=mapped_column(Float)
class AnalysisRun(Base):
    __tablename__='analysis_runs'; id: Mapped[int]=mapped_column(primary_key=True); run_type: Mapped[str]=mapped_column(String(80)); status: Mapped[str]=mapped_column(String(30)); started_at: Mapped[datetime]=mapped_column(DateTime); completed_at: Mapped[datetime|None]=mapped_column(DateTime,nullable=True)
class SystemStatus(Base):
    __tablename__='system_status'; id: Mapped[int]=mapped_column(primary_key=True); service: Mapped[str]=mapped_column(String(80),unique=True); status: Mapped[str]=mapped_column(String(30)); last_checked: Mapped[datetime]=mapped_column(DateTime)

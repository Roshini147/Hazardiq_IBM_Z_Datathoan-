from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import *
from app.services.risk_engine import level
from app.gis.geometry import distance_km
router=APIRouter(prefix='/api')
@router.get('/health')
def health(db:Session=Depends(get_db)):
    try: db.execute(func.count(Area.id).select() if False else __import__('sqlalchemy').text('SELECT 1')); db_ok=True
    except Exception: db_ok=False
    return {'status':'SYSTEM OPERATIONAL' if db_ok else 'DEGRADED','backend':True,'database':db_ok,'postgis':'configured via production PostgreSQL stack'}
@router.get('/dashboard')
def dashboard(db:Session=Depends(get_db)):
    risks=db.query(RiskAssessment).all(); caps=db.query(CapacityAssessment).all(); rel=db.query(RelocationPriority).all(); areas=db.query(Area).all()
    return {'assessed_areas':len(areas),'high_risk_areas':sum(r.level in ('HIGH','CRITICAL') for r in risks),'critical_vulnerability_areas':sum(r.vulnerability>=80 for r in risks),'capacity_deficit_areas':sum(c.deficit>0 for c in caps),'relocation_priority_areas':sum(r.level in ('HIGH','CRITICAL') for r in rel),'safe_capacity':sum(max(0,c.available_capacity-c.required_capacity) for c in caps)}
@router.get('/areas')
def areas(zone:str|None=None,ward:str|None=None,db:Session=Depends(get_db)):
    q=db.query(Area)
    if zone:q=q.filter(Area.zone.ilike(f'%{zone}%'))
    if ward:q=q.filter(Area.ward.ilike(f'%{ward}%'))
    return [a.__dict__ | {'_sa_instance_state':None} for a in q.all()]
@router.get('/risk')
def risks(zone:str|None=None,risk_level:str|None=None,db:Session=Depends(get_db)):
    q=db.query(RiskAssessment,Area).join(Area,RiskAssessment.area_id==Area.id)
    if zone:q=q.filter(Area.zone.ilike(f'%{zone}%'))
    if risk_level:q=q.filter(RiskAssessment.level==risk_level.upper())
    out=[]
    for r,a in q.all(): out.append({'area_id':a.id,'area':a.name,'ward':a.ward,'zone':a.zone,'latitude':a.latitude,'longitude':a.longitude,'score':r.score,'level':r.level,'factors':{'hazard_exposure':r.hazard_exposure,'population_exposure':r.population_exposure,'vulnerability':r.vulnerability,'capacity_deficit':r.capacity_deficit,'accessibility_risk':r.accessibility_risk}})
    return out
@router.get('/vulnerability')
def vulnerability(db:Session=Depends(get_db)):
    return [{'area':a.name,'ward':a.ward,'population':a.population,'households':a.households,'vulnerability':r.vulnerability,'population_exposure':r.population_exposure,'accessibility':100-r.accessibility_risk} for r,a in db.query(RiskAssessment,Area).join(Area,RiskAssessment.area_id==Area.id).all()]
@router.get('/capacity')
def capacity(db:Session=Depends(get_db)):
    return [{'area':a.name,'ward':a.ward,'available_capacity':c.available_capacity,'required_capacity':c.required_capacity,'deficit':c.deficit,'ratio':c.ratio,'level':c.level} for c,a in db.query(CapacityAssessment,Area).join(Area,CapacityAssessment.area_id==Area.id).all()]
@router.get('/relocation')
def relocation(db:Session=Depends(get_db)):
    return [{'area':a.name,'ward':a.ward,'score':r.score,'level':r.level,'recommended_action':r.recommended_action} for r,a in db.query(RelocationPriority,Area).join(Area,RelocationPriority.area_id==Area.id).order_by(RelocationPriority.score.desc()).all()]
@router.get('/hazards')
def hazards(hazard:str|None=None,db:Session=Depends(get_db)):
    q=db.query(Hazard,Area).join(Area,Hazard.area_id==Area.id)
    if hazard:q=q.filter(Hazard.hazard_type.ilike(f'%{hazard}%'))
    return [{'area':a.name,'ward':a.ward,'zone':a.zone,'type':h.hazard_type,'hazard_score':h.hazard_score,'exposure_score':h.exposure_score,'confidence':h.confidence,'source':h.source,'last_updated':h.last_updated} for h,a in q.all()]
@router.get('/resources')
def resources(db:Session=Depends(get_db)):
    return [{'id':r.id,'name':r.name,'type':r.resource_type,'area':r.area,'zone':r.zone,'latitude':r.latitude,'longitude':r.longitude,'capacity':r.capacity,'status':r.status} for r in db.query(Resource).all()]
@router.get('/safe-areas')
def safe_areas(db:Session=Depends(get_db)):
    rows=[]
    for a,r in db.query(Area,RiskAssessment).join(RiskAssessment,Area.id==RiskAssessment.area_id).filter(RiskAssessment.score<40).all():
        c=db.query(CapacityAssessment).filter_by(area_id=a.id).first(); rows.append({'area':a.name,'ward':a.ward,'risk':r.score,'available_capacity':c.available_capacity if c else 0,'suitability_score':round((100-r.score)*.65+(min(100,(c.ratio if c else 0)*100))*.35,2)})
    return sorted(rows,key=lambda x:x['suitability_score'],reverse=True)
@router.get('/data-sources')
def data_sources(db:Session=Depends(get_db)):
    return [d.__dict__ | {'_sa_instance_state':None} for d in db.query(DataSource).all()]
@router.get('/districts')
def districts(): return [{'name':'Chennai','type':'district'}]
@router.get('/zones')
def zones(db:Session=Depends(get_db)): return [{'zone':z[0]} for z in db.query(Area.zone).distinct().all()]
@router.get('/wards')
def wards(db:Session=Depends(get_db)): return [{'ward':w[0]} for w in db.query(Area.ward).distinct().all()]
@router.get('/report/{area_id}')
def report(area_id:int,db:Session=Depends(get_db)):
    a=db.get(Area,area_id); r=db.query(RiskAssessment).filter_by(area_id=area_id).first(); c=db.query(CapacityAssessment).filter_by(area_id=area_id).first(); rel=db.query(RelocationPriority).filter_by(area_id=area_id).first()
    if not a:return {'error':'Area not found'}
    return {'area':a.name,'ward':a.ward,'zone':a.zone,'population':a.population,'households':a.households,'risk':r.score if r else None,'risk_level':r.level if r else None,'capacity':c.available_capacity if c else None,'capacity_deficit':c.deficit if c else None,'relocation_priority':rel.score if rel else None,'recommended_action':rel.recommended_action if rel else None}

# GIS Map Integration Endpoints
@router.get('/risk-zones')
def risk_zones(zone:str|None=None,risk_level:str|None=None,db:Session=Depends(get_db)):
    return risks(zone,risk_level,db)

@router.get('/habitations')
def habitations(db:Session=Depends(get_db)):
    return vulnerability(db)

@router.get('/shelters')
def shelters(db:Session=Depends(get_db)):
    return resources(db)

@router.get('/relocation-priorities')
def relocation_priorities(db:Session=Depends(get_db)):
    return relocation(db)

@router.get('/safer-locations')
def safer_locations(db:Session=Depends(get_db)):
    return safe_areas(db)

import csv, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__),'../../backend'))
from datetime import datetime
from app.database.session import SessionLocal, Base, engine
from app.models.models import *
from app.services.risk_engine import *
DATA_DIR=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../data'))
Base.metadata.create_all(bind=engine)
db=SessionLocal()
try:
    for m in [RelocationPriority,CapacityAssessment,RiskAssessment,Hazard,Resource,Shelter,Area,DataSource,User,District,Zone,Ward,Population,Household,VulnerabilityAssessment,HazardObservation,SafeArea,AnalysisRun,SystemStatus]: db.query(m).delete()
    # Census source
    pop_total=0
    with open(os.path.join(DATA_DIR,'chennai_district_population_census2011.csv'),encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            if r['Category'].startswith('Total Population'): pop_total=int(r['Total'])
    shelters=[]
    with open(os.path.join(DATA_DIR,'chennai_evacuation_relief_shelter_capacity.csv'),encoding='utf-8-sig') as f: shelters=list(csv.DictReader(f))
    groups={}
    for s in shelters:
        if s.get('ward') and s['ward']!='NA': groups.setdefault((s.get('ward','Unknown'),s.get('zone','Unknown')),[]).append(s)
    areas=[]
    for i,((ward,zone),rows) in enumerate(list(groups.items())[:40],1):
        coords=[(float(r['latitude']),float(r['longitude'])) for r in rows if r.get('latitude') not in ('','NA','Unknown') and r.get('longitude') not in ('','NA','Unknown')]
        lat=sum(x[0] for x in coords)/len(coords) if coords else 13.0827
        lon=sum(x[1] for x in coords)/len(coords) if coords else 80.2707
        area=Area(name=f'Ward {ward}',ward=ward,zone=zone,latitude=lat,longitude=lon,population=max(1000,int(pop_total/40)),households=max(250,int(pop_total/40/4)),elevation_m=5.0)
        db.add(area); areas.append(area)
    db.flush()
    # Elevation lookup nearest sample
    elev=[]
    with open(os.path.join(DATA_DIR,'chennai_elevation.csv'),encoding='utf-8-sig') as f: elev=list(csv.DictReader(f))
    for a in areas:
        nearest=min(elev,key=lambda e:(float(e['latitude'])-a.latitude)**2+(float(e['longitude'])-a.longitude)**2) if elev else None
        if nearest:a.elevation_m=float(nearest['elevation_m'])
    # shelter and resource data
    for s in shelters:
        try: lat=float(s.get('latitude','')); lon=float(s.get('longitude',''))
        except: continue
        if not (-90<=lat<=90 and -180<=lon<=180): continue
        cap=int(float(s.get('capacity_persons') or 0)) if str(s.get('capacity_persons','')).replace('.','',1).isdigit() else 0
        db.add(Shelter(external_id=s.get('shelter_id',''),name=s.get('shelter_name','Unnamed'),facility_type=s.get('facility_type','Shelter'),area=s.get('area',''),zone=s.get('zone',''),ward=s.get('ward',''),latitude=lat,longitude=lon,capacity=cap,status=s.get('shelter_status','Unknown')))
    hospitals=[]
    with open(os.path.join(DATA_DIR,'chennai_hospitals_emergency_facilities.csv'),encoding='utf-8-sig') as f: hospitals=list(csv.DictReader(f))
    for h in hospitals:
        try: lat=float(h['latitude']); lon=float(h['longitude'])
        except: continue
        beds=h.get('total_beds','0'); cap=int(float(beds)) if beds.replace('.','',1).isdigit() else 0
        db.add(Resource(name=h.get('facility_name','Hospital'),resource_type=h.get('facility_type','Hospital'),area=h.get('area',''),zone=h.get('zone',''),latitude=lat,longitude=lon,capacity=cap,status=h.get('operational_status','Unknown')))
    db.flush()
    for a in areas:
        # Transparent deterministic scoring based on supplied elevation + location-independent exposure assumptions.
        low_elev=max(0,min(100,100-a.elevation_m*8))
        pop_exp=max(0,min(100,a.population/(pop_total/40)*55))
        vulnerability=round(min(100,35+low_elev*.25+(20 if a.population>pop_total/40 else 0)),2)
        accessibility=round(max(5,min(100,low_elev*.65+20)),2)
        hazard=min(100,round(.65*low_elev+.35*55,2))
        required=a.population*.08
        shelters_for=db.query(Shelter).filter(Shelter.ward==a.ward).all()
        available=sum(s.capacity for s in shelters_for)
        ratio=available/required if required else 0
        deficit=max(0,required-available)
        cap_def=min(100,deficit/max(required,1)*100)
        rs=risk_score(hazard_exposure=hazard,population_exposure=pop_exp,vulnerability=vulnerability,capacity_deficit=cap_def,accessibility_risk=accessibility)
        db.add(Population(area_id=a.id,total=a.population,children=int(a.population*.18),elderly=int(a.population*.09),assistance_required=int(a.population*.03)))
        db.add(Household(area_id=a.id,total=a.households))
        db.add(VulnerabilityAssessment(area_id=a.id,score=vulnerability,accessibility_score=100-accessibility,infrastructure_score=max(0,100-hazard*.4)))
        c=CapacityAssessment(area_id=a.id,available_capacity=available,required_capacity=required,deficit=deficit,ratio=ratio,level=capacity_level(ratio)); db.add(c)
        r=RiskAssessment(area_id=a.id,hazard_exposure=hazard,population_exposure=pop_exp,vulnerability=vulnerability,capacity_deficit=cap_def,accessibility_risk=accessibility,score=rs,level=level(rs)); db.add(r)
        rel=relocation_score(rs,vulnerability,cap_def,pop_exp,accessibility)
        action='Maintain monitoring and preparedness' if rel<40 else ('Pre-position resources and verify evacuation routes' if rel<60 else ('Prioritize relocation planning and shelter capacity' if rel<80 else 'Initiate urgent relocation planning and capacity escalation'))
        db.add(RelocationPriority(area_id=a.id,score=rel,level=relocation_level(rel),recommended_action=action))
        for ht,hs in [('Flood',hazard),('Heavy Rainfall',min(100,hazard+5)),('Coastal Exposure',min(100,hazard*.8)),('Heat Risk',round(max(0,100-low_elev*.4),2))]:
            db.add(Hazard(area_id=a.id,hazard_type=ht,hazard_score=hs,exposure_score=round((hs+vulnerability)/2,2),confidence=.72,source='Derived from supplied Chennai elevation/shelter/historical datasets',last_updated=datetime.utcnow()))
    db.add(District(name='Chennai'))
    db.add(User(username='viewer',role='Viewer'))
    for z in sorted({a.zone for a in areas}): db.add(Zone(name=z))
    for a in areas: db.add(Ward(name=a.ward,zone=a.zone))
    db.add(SystemStatus(service='HAZARDIQ API',status='operational',last_checked=datetime.utcnow()))
    sources=[
      ('Census of India / Tamil Nadu Statistical Handbook','Population and household context','CSV','Chennai, 2011','https://censusindia.gov.in/census.website/'),
      ('Chennai Flood Monitor','Flood and rainfall reference','Web','Chennai','https://chennaifloodmonitor.com/'),
      ('Greater Chennai Corporation GIS','Administrative ward and zone boundaries','GIS service','Greater Chennai','https://gisgcc.chennaicorporation.gov.in/'),
      ('ISRO / NRSC NDEM','National disaster geospatial reference','GIS','India / Chennai','https://ndem.nrsc.gov.in/'),
      ('OpenCity Chennai','Urban/open civic data reference','Open data','Chennai','https://opencity.in/'),
    ]
    for n,d,t,c,u in sources: db.add(DataSource(name=n,description=d,data_type=t,coverage=c,source_url=u,retrieved_at='',confidence=.75))
    db.commit()
finally: db.close()

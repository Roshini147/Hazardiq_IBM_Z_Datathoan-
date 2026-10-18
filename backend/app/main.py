from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import Base,engine
from app.models import models
from app.api.routes import router
app=FastAPI(title='HAZARDIQ API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in settings.cors_origins.split(',')],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
Base.metadata.create_all(bind=engine)
app.include_router(router)
@app.get('/')
def root(): return {'name':'HAZARDIQ','description':'Multi-Hazard Risk & Relocation Intelligence','docs':'/docs'}

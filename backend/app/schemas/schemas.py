from pydantic import BaseModel, Field
class RiskWeights(BaseModel):
    hazard_exposure: float=Field(.30,ge=0,le=1); population_exposure: float=Field(.20,ge=0,le=1); vulnerability: float=Field(.25,ge=0,le=1); capacity_deficit: float=Field(.15,ge=0,le=1); accessibility_risk: float=Field(.10,ge=0,le=1)

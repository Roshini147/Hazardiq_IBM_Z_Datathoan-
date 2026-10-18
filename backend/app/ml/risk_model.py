"""Explainable scoring fallback. Train supervised models only when labelled observations exist."""
from app.services.risk_engine import risk_score
class ExplainableRiskModel:
    trained=False
    def predict(self,features): return risk_score(**features)

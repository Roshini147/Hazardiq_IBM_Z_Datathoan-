from app.services.risk_engine import relocation_score
class RelocationModel:
    trained=False
    def predict(self,**kwargs): return relocation_score(**kwargs)

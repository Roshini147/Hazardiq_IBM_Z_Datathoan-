from app.services.risk_engine import risk_score,level,relocation_score,relocation_level,capacity_level
def test_risk_boundaries():
    for x,expected in [(0,'SAFE / MINIMAL'),(20,'LOW'),(40,'MODERATE'),(60,'HIGH'),(80,'CRITICAL')]: assert level(risk_score(hazard_exposure=x,population_exposure=x,vulnerability=x,capacity_deficit=x,accessibility_risk=x))==expected
def test_relocation_boundaries():
    assert relocation_level(relocation_score(80,80,80,80,80))=='CRITICAL'
def test_capacity():
    assert capacity_level(1)=='ADEQUATE'; assert capacity_level(.8)=='MODERATE'; assert capacity_level(.5)=='DEFICIT'; assert capacity_level(.2)=='CRITICAL DEFICIT'

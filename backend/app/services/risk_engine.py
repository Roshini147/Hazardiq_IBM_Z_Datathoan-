WEIGHTS={"hazard_exposure":.30,"population_exposure":.20,"vulnerability":.25,"capacity_deficit":.15,"accessibility_risk":.10}
def clamp(v): return max(0,min(100,float(v)))
def level(score):
    if score>=80:return 'CRITICAL'
    if score>=60:return 'HIGH'
    if score>=40:return 'MODERATE'
    if score>=20:return 'LOW'
    return 'SAFE / MINIMAL'
def risk_score(**x):
    score=sum(WEIGHTS[k]*clamp(x.get(k,0)) for k in WEIGHTS)
    return round(clamp(score),2)
def relocation_score(risk,vulnerability,capacity_deficit,population_exposure,accessibility_risk):
    return round(clamp(.35*risk+.25*vulnerability+.20*capacity_deficit+.10*population_exposure+.10*accessibility_risk),2)
def relocation_level(s):
    if s>=80:return 'CRITICAL'
    if s>=60:return 'HIGH'
    if s>=40:return 'MODERATE'
    if s>=20:return 'LOW'
    return 'MINIMAL'
def capacity_level(ratio):
    if ratio>=1:return 'ADEQUATE'
    if ratio>=.75:return 'MODERATE'
    if ratio>=.4:return 'DEFICIT'
    return 'CRITICAL DEFICIT'

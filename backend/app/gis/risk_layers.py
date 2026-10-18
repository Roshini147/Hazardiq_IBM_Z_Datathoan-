def classify(score):
    return 'CRITICAL' if score>=80 else 'HIGH' if score>=60 else 'MODERATE' if score>=40 else 'LOW' if score>=20 else 'SAFE'

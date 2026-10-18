from app.gis.geometry import distance_km
def test_distance_zero(): assert distance_km(13,80,13,80)==0
def test_distance_positive(): assert distance_km(13,80,13.1,80)>0

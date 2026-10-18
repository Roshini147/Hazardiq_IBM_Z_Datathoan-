from .geometry import distance_km
def nearest_point(origin,points):
    return min(points,key=lambda p:distance_km(origin[0],origin[1],p[0],p[1])) if points else None

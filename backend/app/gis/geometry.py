from math import radians,sin,cos,sqrt,atan2
def distance_km(lat1,lon1,lat2,lon2):
    R=6371.0; p1,p2=radians(lat1),radians(lat2); dp=radians(lat2-lat1); dl=radians(lon2-lon1)
    a=sin(dp/2)**2+cos(p1)*cos(p2)*sin(dl/2)**2
    return round(2*R*atan2(sqrt(a),sqrt(1-a)),2)

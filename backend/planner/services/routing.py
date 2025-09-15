import logging

import requests

logger = logging.getLogger(__name__)


def get_osrm_route(coords_list):
    """
    Given a list of (lat, lon) tuples, fetch route geometry from OSRM.
    Returns: { 'distance': float (meters), 'duration': float (seconds), 'geometry': [ [lat, lon], ... ] }
    """
    if not coords_list or len(coords_list) < 2:
        return None
    # OSRM expects lon,lat order
    coord_str = ";".join([f"{lon},{lat}" for lat, lon in coords_list])
    url = f"https://router.project-osrm.org/route/v1/driving/{coord_str}"
    params = {
        "overview": "full",
        "geometries": "geojson",
    }
    try:
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("routes"):
            route = data["routes"][0]
            geometry = route["geometry"]["coordinates"]  # [ [lon, lat], ... ]
            # Convert to [lat, lon]
            geometry_latlon = [[lat, lon] for lon, lat in geometry]
            return {
                "distance_m": route["distance"],
                "duration_s": route["duration"],
                "geometry": geometry_latlon,
            }
    except Exception as e:
        logger.error(f"Geocoding failed for {name}: {e}")
    return None

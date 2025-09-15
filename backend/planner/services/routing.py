import os
import requests

MAPBOX_TOKEN = os.environ.get("MAPBOX_API_KEY")


def get_mapbox_route(coords_list):
    """
    coords_list: [(lat, lon), ...]
    Returns: {'distance_m', 'duration_s', 'geometry': [[lat, lon], ...]}
    """
    if not coords_list or len(coords_list) < 2:
        return None

    # Mapbox expects lon,lat order
    coord_str = ";".join([f"{lon},{lat}" for lat, lon in coords_list])
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{coord_str}"
    params = {
        "access_token": MAPBOX_TOKEN,
        "geometries": "geojson",
        "overview": "full",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data.get("routes"):
            route = data["routes"][0]
            geometry = route["geometry"]["coordinates"]  # [ [lon, lat], ... ]
            geometry_latlon = [[lat, lon] for lon, lat in geometry]
            return {
                "distance_m": route["distance"],
                "duration_s": route["duration"],
                "geometry": geometry_latlon,
            }
    except Exception as e:
        print(f"Mapbox routing failed: {e}")
        return None

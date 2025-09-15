import os
import requests

MAPBOX_TOKEN = os.environ.get("MAPBOX_API_KEY")


def geocode_location(name):
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{name}.json"
    params = {"access_token": MAPBOX_TOKEN, "limit": 1}
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data["features"]:
            lon, lat = data["features"][0]["center"]
            return lat, lon
    except Exception as e:
        print(f"Geocoding failed for {name}: {e}")
    return None, None

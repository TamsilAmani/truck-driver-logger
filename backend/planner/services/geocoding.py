import logging

import requests

logger = logging.getLogger(__name__)


def geocode_location(name):
    """Return (lat, lon) for a location name using Nominatim."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": name,
        "format": "json",
        "limit": 1,
    }
    try:
        resp = requests.get(url, params=params, headers={"User-Agent": "truck-driver-logger/1.0"})
        resp.raise_for_status()
        results = resp.json()
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        logger.error(f"Geocoding failed for {name}: {e}")
    return None, None

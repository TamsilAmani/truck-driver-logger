# Create your views here.
import json
from datetime import datetime, timedelta
from math import atan2, cos, radians, sin, sqrt

import requests
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, LogSheet, Stop, Trip
from .serializers import TripSerializer
from .services.event_planning import plan_trip
from .services.geocoding import geocode_location
from .services.routing import get_mapbox_route


class PlanTripView(APIView):
    """
    Mock planner API
    Accepts trip input and returns a fake planned trip with stops, events, and logsheets.
    """

    def post(self, request):
        data = request.data

        # Extract input
        current_location = data.get("current_location")
        pickup_location = data.get("pickup_location")
        dropoff_location = data.get("dropoff_location")
        current_cycle_used = data.get("current_cycle_used", 0)

        if not all([current_location, pickup_location, dropoff_location]):
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Geocode locations
        current_coords = geocode_location(current_location)
        pickup_coords = geocode_location(pickup_location)
        dropoff_coords = geocode_location(dropoff_location)

        print("Current coords:", current_coords)
        print("Pickup coords:", pickup_coords)
        print("Dropoff coords:", dropoff_coords)

        # Create trip
        trip = Trip.objects.create(
            current_location=current_location,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            current_cycle_used=current_cycle_used,
        )

        # Trip start time: tomorrow at 7 AM
        start_time = timezone.now().replace(hour=7, minute=0, second=0, microsecond=0) + timedelta(
            days=1
        )

        # Fetch route geometry from OSRM
        route = None
        fuel_stops = []
        break_stops = []

        if all(
            [
                current_coords[0] is not None,
                current_coords[1] is not None,
                pickup_coords[0] is not None,
                pickup_coords[1] is not None,
                dropoff_coords[0] is not None,
                dropoff_coords[1] is not None,
            ]
        ):
            route = get_mapbox_route(
                [
                    current_coords,
                    pickup_coords,
                    dropoff_coords,
                ]
            )

            """
            Place fuel and break stops along the route
            """

            def haversine(lat1, lon1, lat2, lon2):
                """Return distance in meters between two lat/lon points using the Haversine formula."""
                R = 6371000  # Earth radius in meters
                phi1, phi2 = radians(lat1), radians(lat2)
                dphi = radians(lat2 - lat1)
                dlambda = radians(lon2 - lon1)
                a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
                return R * 2 * atan2(sqrt(a), sqrt(1 - a))

            def place_stops_along_route(geometry, interval_m):
                # Compute cumulative distances
                cum_dist = [0]
                for i in range(1, len(geometry)):
                    d = haversine(*geometry[i - 1], *geometry[i])
                    cum_dist.append(cum_dist[-1] + d)

                total_distance = cum_dist[-1]
                num_stops = int(total_distance // interval_m)

                stops = []
                for i in range(1, num_stops + 1):
                    target = i * interval_m
                    # Find nearest point in geometry
                    idx = min(range(len(cum_dist)), key=lambda j: abs(cum_dist[j] - target))
                    lat, lon = geometry[idx]
                    stops.append({"lat": lat, "lon": lon, "order_index": i})
                return stops

            # Add fuel stops every 1000 miles (1609.34 meters per mile)

            # --- Main logic ---
            if route and route["geometry"]:
                total_distance_m = route["distance_m"]
                total_duration_s = route["duration_s"]
                geometry = route["geometry"]

                # Fuel stops: every 1000 miles
                fuel_interval_m = 1000 * 1609.34
                fuel_stops = place_stops_along_route(geometry, fuel_interval_m)

                # Average speed in meters per second
                avg_speed_mps = total_distance_m / total_duration_s if total_duration_s > 0 else 0

                # Break stops: every 8 hours
                break_interval_m = avg_speed_mps * 8 * 3600
                break_stops = place_stops_along_route(geometry, break_interval_m)

                # ------------------------------
                # Build unified list of all stops
                # ------------------------------
                stops_info = []

                # Current
                current_lat, current_lon = current_coords
                stops_info.append(
                    {
                        "type": "current",
                        "location": current_location,
                        "geometry_idx": 0,
                        "duration_hours": 0.0,
                        "lat": current_lat,
                        "lon": current_lon,
                    }
                )

                # Pickup
                pickup_lat, pickup_lon = pickup_coords
                pickup_idx = min(
                    range(len(geometry)),
                    key=lambda i: (geometry[i][0] - pickup_lat) ** 2
                    + (geometry[i][1] - pickup_lon) ** 2,
                )

                stops_info.append(
                    {
                        "type": "pickup",
                        "location": pickup_location,
                        "geometry_idx": pickup_idx,
                        "duration_hours": 1.0,
                        "lat": pickup_lat,
                        "lon": pickup_lon,
                    }
                )

                # Dropoff
                drop_lat, drop_lon = dropoff_coords
                dropoff_idx = min(
                    range(len(geometry)),
                    key=lambda i: (geometry[i][0] - drop_lat) ** 2
                    + (geometry[i][1] - drop_lon) ** 2,
                )

                stops_info.append(
                    {
                        "type": "dropoff",
                        "location": dropoff_location,
                        "geometry_idx": dropoff_idx,
                        "duration_hours": 1.0,
                        "lat": drop_lat,
                        "lon": drop_lon,
                    }
                )

                # Fuel stops
                for fs in fuel_stops:
                    lat, lon = fs["lat"], fs["lon"]
                    idx = min(
                        range(len(geometry)),
                        key=lambda i: abs(geometry[i][0] - lat) + abs(geometry[i][1] - lon),
                    )
                    stops_info.append(
                        {
                            "type": "fuel",
                            "location": f"{lat},{lon}",
                            "geometry_idx": idx,
                            "duration_hours": 0.5,
                            "lat": lat,
                            "lon": lon,
                        }
                    )

                # Break stops
                for bs in break_stops:
                    lat, lon = bs["lat"], bs["lon"]
                    idx = min(
                        range(len(geometry)),
                        key=lambda i: abs(geometry[i][0] - lat) + abs(geometry[i][1] - lon),
                    )
                    stops_info.append(
                        {
                            "type": "break",
                            "location": f"{lat},{lon}",
                            "geometry_idx": idx,
                            "duration_hours": 0.5,
                            "lat": lat,
                            "lon": lon,
                        }
                    )

                # Sort all stops by their order along geometry
                stops_info_sorted = sorted(stops_info, key=lambda s: s["geometry_idx"])

                # ------------------------------
                # Compute arrival times
                # ------------------------------
                prev_idx = 0
                prev_time = start_time
                all_stop_objs = []

                for idx, stop in enumerate(stops_info_sorted, start=1):
                    # Distance from prev stop to this stop
                    seg_dist = 0
                    for i in range(prev_idx, stop["geometry_idx"]):
                        lat1, lon1 = geometry[i]
                        lat2, lon2 = geometry[i + 1]
                        seg_dist += haversine(lat1, lon1, lat2, lon2)

                    # Travel time
                    travel_time = (
                        timedelta(seconds=seg_dist / avg_speed_mps)
                        if avg_speed_mps > 0
                        else timedelta(0)
                    )
                    arrival_time = prev_time + travel_time

                    # Save Stop object
                    stop_obj = Stop.objects.create(
                        trip=trip,
                        type=stop["type"],
                        location=stop["location"],
                        arrival_time=arrival_time,
                        duration_hours=stop["duration_hours"],
                        order_index=idx,
                        lat=stop.get("lat"),
                        lon=stop.get("lon"),
                    )
                    all_stop_objs.append(stop_obj)

                    # Update prev time and index for next stop
                    prev_time = arrival_time + timedelta(hours=stop["duration_hours"])
                    prev_idx = stop["geometry_idx"]

                plan_trip(all_stop_objs)

        # Serialize trip with stops + log sheets
        serializer = TripSerializer(trip)
        trip_data = serializer.data
        # Add route metadata
        trip_data["route_geometry"] = route["geometry"] if route else []
        trip_data["route_distance_m"] = route["distance_m"] if route else None
        trip_data["route_duration_s"] = route["duration_s"] if route else None

        return Response(trip_data, status=status.HTTP_201_CREATED)

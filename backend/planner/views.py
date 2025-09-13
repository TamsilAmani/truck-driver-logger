# Create your views here.
from datetime import datetime, timedelta

import requests
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, LogSheet, Stop, Trip
from .serializers import TripSerializer
from .services.geocoding import geocode_location
from .services.routing import get_osrm_route


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

        # Create trip
        trip = Trip.objects.create(
            current_location=current_location,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            current_cycle_used=current_cycle_used,
        )

        # Build fake timeline
        start_time = timezone.now().replace(minute=0, second=0, microsecond=0)

        # Pickup stop
        pickup_stop = Stop.objects.create(
            trip=trip,
            type="pickup",
            location=pickup_location,
            arrival_time=start_time + timedelta(hours=2),
            duration_hours=1.0,
            order_index=1,
        )


        # Dropoff stop
        dropoff_stop = Stop.objects.create(
            trip=trip,
            type="dropoff",
            location=dropoff_location,
            arrival_time=start_time + timedelta(hours=9),
            duration_hours=1.0,
            order_index=3,
        )

        # Events (mock driving and on-duty blocks)
        Event.objects.create(
            trip=trip,
            status="driving",
            start_time=start_time,
            end_time=start_time + timedelta(hours=2),
            note="Driving to pickup",
            order_index=1,
        )

        Event.objects.create(
            trip=trip,
            status="on_duty",
            start_time=start_time + timedelta(hours=2),
            end_time=start_time + timedelta(hours=3),
            note="Pickup",
            order_index=2,
        )

        Event.objects.create(
            trip=trip,
            status="driving",
            start_time=start_time + timedelta(hours=3),
            end_time=start_time + timedelta(hours=5),
            note="Driving to fuel stop",
            order_index=3,
        )

        Event.objects.create(
            trip=trip,
            status="on_duty",
            start_time=start_time + timedelta(hours=5),
            end_time=start_time + timedelta(hours=5, minutes=30),
            note="Fuel stop",
            order_index=4,
        )

        Event.objects.create(
            trip=trip,
            status="driving",
            start_time=start_time + timedelta(hours=5, minutes=30),
            end_time=start_time + timedelta(hours=9),
            note="Driving to dropoff",
            order_index=5,
        )

        Event.objects.create(
            trip=trip,
            status="on_duty",
            start_time=start_time + timedelta(hours=9),
            end_time=start_time + timedelta(hours=10),
            note="Dropoff",
            order_index=6,
        )

        # LogSheet (for one day)
        LogSheet.objects.create(
            trip=trip,
            date=start_time.date(),
            sheet_json={
                "events": [
                    {"status": "driving", "start": "06:00", "end": "08:00"},
                    {"status": "on_duty", "start": "08:00", "end": "09:00", "note": "Pickup"},
                    {"status": "driving", "start": "09:00", "end": "11:00"},
                    {"status": "on_duty", "start": "11:00", "end": "11:30", "note": "Fuel stop"},
                    {"status": "driving", "start": "11:30", "end": "15:00"},
                    {"status": "on_duty", "start": "15:00", "end": "16:00", "note": "Dropoff"},
                ]
            },
        )

        # Geocode stop locations
        stop_coords = {}
        for stop in [pickup_stop, dropoff_stop]:
            lat, lon = geocode_location(stop.location)
            stop_coords[stop.id] = {"lat": lat, "lon": lon}

        # Fetch route geometry from OSRM
        route = None
        fuel_stops = []
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
            route = get_osrm_route(
                [
                    current_coords,
                    pickup_coords,
                    dropoff_coords,
                ]
            )

            # print("##################################")
            # print("OSRM Route Data:", route)
            # print("##################################")

            # Add fuel stops every 1000 miles (1609.34 meters per mile)
            break_stops = []
            if route and route["geometry"]:
                total_distance_m = route["distance_m"]
                interval_m = 1000 * 1609.34
                num_stops = int(total_distance_m // interval_m)
                geometry = route["geometry"]
                if num_stops > 0:
                    # Evenly space fuel stops along the route geometry
                    step = len(geometry) // (num_stops + 1)
                    for i in range(1, num_stops + 1):
                        idx = i * step
                        if idx < len(geometry):
                            lat, lon = geometry[idx]
                            fuel_stops.append({"lat": lat, "lon": lon, "order_index": i})

                # --- Break stops every 8 hours ---
                total_duration_h = route["duration_s"] / 3600.0 if route["duration_s"] else 0
                avg_speed_mph = (
                    (total_distance_m / 1609.34) / total_duration_h if total_duration_h > 0 else 0
                )
                break_interval_h = 8
                break_distance_m = (
                    avg_speed_mph * break_interval_h * 1609.34 if avg_speed_mph > 0 else 0
                )
                num_breaks = (
                    int(total_distance_m // break_distance_m) if break_distance_m > 0 else 0
                )

                def haversine(lat1, lon1, lat2, lon2):
                    from math import atan2, cos, radians, sin, sqrt

                    R = 6371000  # meters
                    phi1, phi2 = radians(lat1), radians(lat2)
                    dphi = radians(lat2 - lat1)
                    dlambda = radians(lon2 - lon1)
                    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
                    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

                cum_dist = [0]
                for i in range(1, len(geometry)):
                    lat1, lon1 = geometry[i - 1]
                    lat2, lon2 = geometry[i]
                    d = haversine(lat1, lon1, lat2, lon2)
                    cum_dist.append(cum_dist[-1] + d)
                for i in range(1, num_breaks + 1):
                    target_dist = i * break_distance_m
                    idx = min(range(len(cum_dist)), key=lambda j: abs(cum_dist[j] - target_dist))
                    lat, lon = geometry[idx]
                    break_stops.append({"lat": lat, "lon": lon, "order_index": i})

        # Return trip with nested data and coordinates
        serializer = TripSerializer(trip)
        trip_data = serializer.data
        trip_data["current_location_coords"] = {"lat": current_coords[0], "lon": current_coords[1]}
        trip_data["pickup_location_coords"] = {"lat": pickup_coords[0], "lon": pickup_coords[1]}
        trip_data["dropoff_location_coords"] = {"lat": dropoff_coords[0], "lon": dropoff_coords[1]}
        trip_data["stop_coords"] = stop_coords
        trip_data["route_geometry"] = route["geometry"] if route else []
        trip_data["route_distance_m"] = route["distance_m"] if route else None
        trip_data["route_duration_s"] = route["duration_s"] if route else None
        trip_data["fuel_stops"] = fuel_stops
        trip_data["break_stops"] = break_stops
        return Response(trip_data, status=status.HTTP_201_CREATED)

# Create your views here.
from datetime import datetime, timedelta

from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, LogSheet, Stop, Trip
from .serializers import TripSerializer


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

        # Create trip
        trip = Trip.objects.create(
            current_location=current_location,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            current_cycle_used=current_cycle_used,
            distance_miles=500,  # fake value
            duration_hours=10.0,  # fake value
        )

        # Build fake timeline
        start_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

        # Pickup stop
        pickup_stop = Stop.objects.create(
            trip=trip,
            type="pickup",
            location=pickup_location,
            arrival_time=start_time + timedelta(hours=2),
            duration_hours=1.0,
            order_index=1,
        )

        # Fuel stop
        fuel_stop = Stop.objects.create(
            trip=trip,
            type="fuel",
            location="Fake Fuel Station",
            arrival_time=start_time + timedelta(hours=5),
            duration_hours=0.5,
            order_index=2,
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

        # Return trip with nested data
        serializer = TripSerializer(trip)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

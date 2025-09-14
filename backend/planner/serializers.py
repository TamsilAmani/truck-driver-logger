from rest_framework import serializers

from .models import Event, LogSheet, Stop, Trip


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = [
            "id",
            "type",
            "location",
            "arrival_time",
            "duration_hours",
            "order_index",
            "lat",
            "lon",
        ]


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "status",
            "start_time",
            "end_time",
            "note",
            "order_index",
        ]


class LogSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogSheet
        fields = [
            "id",
            "date",
            "sheet_json",
        ]


class TripSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    events = EventSerializer(many=True, read_only=True)
    logsheets = LogSheetSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "created_at",
            "stops",
            "events",
            "logsheets",
        ]

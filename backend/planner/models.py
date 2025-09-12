from django.db import models


class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.IntegerField()

    distance_miles = models.FloatField(null=True, blank=True)
    duration_hours = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip {self.id}: {self.current_location} → {self.dropoff_location}"


class Stop(models.Model):
    TRIP_STOP_TYPES = [
        ("pickup", "Pickup"),
        ("dropoff", "Dropoff"),
        ("fuel", "Fuel"),
        ("break", "Break"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    type = models.CharField(max_length=50, choices=TRIP_STOP_TYPES)
    location = models.CharField(max_length=255)
    arrival_time = models.DateTimeField()
    duration_hours = models.FloatField(default=0.5)  # default 30 mins for breaks
    order_index = models.IntegerField()

    def __str__(self):
        return f"{self.type.title()} stop at {self.location}"


class Event(models.Model):
    EVENT_STATUSES = [
        ("driving", "Driving"),
        ("on_duty", "On Duty (not driving)"),
        ("off_duty", "Off Duty"),
        ("sleeper", "Sleeper Berth"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="events")
    status = models.CharField(max_length=50, choices=EVENT_STATUSES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    note = models.CharField(max_length=255, null=True, blank=True)
    order_index = models.IntegerField()

    def __str__(self):
        return f"{self.status} ({self.start_time} → {self.end_time})"


class LogSheet(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="logsheets")
    date = models.DateField()
    sheet_json = models.JSONField()  # store daily events in JSON

    def __str__(self):
        return f"LogSheet {self.date} for Trip {self.trip.id}"

from datetime import timedelta

from django.utils import timezone
from planner.models import Event, LogSheet


def create_split_event(trip, status, start_time, end_time, note, order_index):
    """
    Create events that don't cross midnight.
    If an event spans multiple days, split it at midnight.
    """
    events = []
    current_start = start_time
    current_end = end_time

    while current_start.date() != current_end.date():
        midnight = current_start.replace(hour=23, minute=59, second=59, microsecond=999999)
        e = Event.objects.create(
            trip=trip,
            status=status,
            start_time=current_start,
            end_time=midnight,
            note=note,
            order_index=order_index,
        )
        events.append(e)

        # move to next day
        current_start = midnight + timedelta(microseconds=1)
        order_index += 1

    # final piece
    e = Event.objects.create(
        trip=trip,
        status=status,
        start_time=current_start,
        end_time=current_end,
        note=note,
        order_index=order_index,
    )
    events.append(e)
    return events


def plan_trip(all_stops_obj):
    log_sheets = []  # all Event objects
    order_index = 0  # global ordering

    for idx, stop in enumerate(all_stops_obj):
        prev_stop = all_stops_obj[idx - 1] if idx > 0 else None

        if stop.type == "current":
            log_sheets += create_split_event(
                trip=stop.trip,
                status="off_duty",
                start_time=timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                + timedelta(days=1),
                end_time=stop.arrival_time,
                note="Sleeping till duty starts",
                order_index=order_index,
            )
            order_index += len(log_sheets)

        elif stop.type == "break":
            log_sheets += create_split_event(
                trip=stop.trip,
                status="driving",
                start_time=prev_stop.arrival_time + timedelta(hours=prev_stop.duration_hours),
                end_time=stop.arrival_time,
                note="Driving to break",
                order_index=order_index,
            )
            order_index += len(log_sheets)

            log_sheets += create_split_event(
                trip=stop.trip,
                status="off_duty",
                start_time=stop.arrival_time,
                end_time=stop.arrival_time + timedelta(hours=stop.duration_hours),
                note="Taking a break",
                order_index=order_index,
            )
            order_index += len(log_sheets)

        elif stop.type == "fuel":
            log_sheets += create_split_event(
                trip=stop.trip,
                status="driving",
                start_time=prev_stop.arrival_time + timedelta(hours=prev_stop.duration_hours),
                end_time=stop.arrival_time,
                note="Driving to fuel stop",
                order_index=order_index,
            )
            order_index += len(log_sheets)

            log_sheets += create_split_event(
                trip=stop.trip,
                status="on_duty",
                start_time=stop.arrival_time,
                end_time=stop.arrival_time + timedelta(hours=stop.duration_hours),
                note="Refueling",
                order_index=order_index,
            )
            order_index += len(log_sheets)

        elif stop.type == "pickup":
            log_sheets += create_split_event(
                trip=stop.trip,
                status="driving",
                start_time=prev_stop.arrival_time + timedelta(hours=prev_stop.duration_hours),
                end_time=stop.arrival_time,
                note="Driving to pickup",
                order_index=order_index,
            )
            order_index += len(log_sheets)

            log_sheets += create_split_event(
                trip=stop.trip,
                status="on_duty",
                start_time=stop.arrival_time,
                end_time=stop.arrival_time + timedelta(hours=stop.duration_hours),
                note="Loading cargo",
                order_index=order_index,
            )
            order_index += len(log_sheets)

        elif stop.type == "dropoff":
            log_sheets += create_split_event(
                trip=stop.trip,
                status="driving",
                start_time=prev_stop.arrival_time + timedelta(hours=prev_stop.duration_hours),
                end_time=stop.arrival_time,
                note="Driving to dropoff",
                order_index=order_index,
            )
            order_index += len(log_sheets)

            log_sheets += create_split_event(
                trip=stop.trip,
                status="on_duty",
                start_time=stop.arrival_time,
                end_time=stop.arrival_time + timedelta(hours=stop.duration_hours),
                note="Unloading cargo",
                order_index=order_index,
            )
            order_index += len(log_sheets)

    # Final off-duty event till midnight
    last_event = log_sheets[-1]
    log_sheets += create_split_event(
        trip=last_event.trip,
        status="off_duty",
        start_time=last_event.end_time,
        end_time=last_event.end_time.replace(hour=23, minute=59, second=59, microsecond=999999),
        note="Off duty till midnight",
        order_index=order_index,
    )

    # ---- Group by date for frontend ----
    grouped = {}
    for e in log_sheets:
        day = e.start_time.date().isoformat()
        if day not in grouped:
            grouped[day] = {"date": day, "events": []}
        grouped[day]["events"].append(
            {
                "status": e.status,
                "status_display": e.get_status_display(),
                "start_time": e.start_time.isoformat(),
                "end_time": e.end_time.isoformat(),
                "note": e.note,
                "order_index": e.order_index,
            }
        )

    # ---- Persist LogSheets ----
    trip = all_stops_obj[0].trip
    for day, data in grouped.items():
        LogSheet.objects.update_or_create(
            trip=trip,
            date=day,
            defaults={"sheet_json": data},
        )

    print("\n--- Planned Events ---")
    for g in grouped.values():
        print(f"Date: {g['date']}")
        for e in g["events"]:
            print(f"  {e['status']} from {e['start_time']} to {e['end_time']} - {e['note']}")
    print("--- End Events ---\n")

    # return {"log_sheets": list(grouped.values())}

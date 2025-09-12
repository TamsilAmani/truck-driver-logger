function TripResults({ trip }) {
    if (!trip) return null;

    return (
        <div>
            <h2>Trip Results</h2>
            <p><strong>ID:</strong> {trip.id}</p>
            <p><strong>From:</strong> {trip.current_location}</p>
            <p><strong>Pickup:</strong> {trip.pickup_location}</p>
            <p><strong>Dropoff:</strong> {trip.dropoff_location}</p>
            <p><strong>Distance:</strong> {trip.distance_miles} miles</p>
            <p><strong>Duration:</strong> {trip.duration_hours} hrs</p>

            <h3>Stops</h3>
            <ul>
                {trip.stops.map((s) => (
                    <li key={s.id}>
                        {s.type} at {s.location} (arrive: {s.arrival_time})
                    </li>
                ))}
            </ul>

            <h3>Events</h3>
            <ul>
                {trip.events.map((e) => (
                    <li key={e.id}>
                        {e.status} ({e.start_time} → {e.end_time}) {e.note && `- ${e.note}`}
                    </li>
                ))}
            </ul>

            <h3>Log Sheets</h3>
            <pre>{JSON.stringify(trip.logsheets, null, 2)}</pre>
        </div>
    );
}

export default TripResults;

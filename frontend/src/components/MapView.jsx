import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

function MapView({ trip }) {
    // Custom marker icons
    const markerIcons = {
        current: L.divIcon({
            className: 'custom-marker current-marker',
            html: '<div style="background:#2563eb;border-radius:50%;width:24px;height:24px;border:3px solid #fff;box-shadow:0 0 4px #2563eb;"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        }),
        pickup: L.divIcon({
            className: 'custom-marker pickup-marker',
            html: '<div style="background:#22c55e;border-radius:50%;width:24px;height:24px;border:3px solid #fff;box-shadow:0 0 4px #22c55e;"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        }),
        dropoff: L.divIcon({
            className: 'custom-marker dropoff-marker',
            html: '<div style="background:#ef4444;border-radius:50%;width:24px;height:24px;border:3px solid #fff;box-shadow:0 0 4px #ef4444;"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        }),
        fuel: L.divIcon({
            className: 'custom-marker fuel-marker',
            html: '<div style="background:#6b7280;border-radius:50%;width:24px;height:24px;border:3px solid #fff;box-shadow:0 0 4px #6b7280;"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        }),
        break: L.divIcon({
            className: 'custom-marker break-marker',
            html: '<div style="background:#f59e42;border-radius:50%;width:24px;height:24px;border:3px solid #fff;box-shadow:0 0 4px #f59e42;"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        }),
    };
    if (!trip) return null;

    const stops = trip.stops || [];
    const routeGeometry = trip.route_geometry || [];

    // Center map on current location first
    let center = { lat: 0, lng: 0 };
    let zoom = 8;

    // Priority 1: Use current_location if it has coordinates
    if (trip.current_location) {
        // If current_location has lat/lng properties
        if (trip.current_location.lat && trip.current_location.lng) {
            center = { lat: trip.current_location.lat, lng: trip.current_location.lng };
        }
        // If current_location has lat/lon properties  
        else if (trip.current_location.lat && trip.current_location.lon) {
            center = { lat: trip.current_location.lat, lng: trip.current_location.lon };
        }
        // If it's a string, we'll use fallback methods below
    }

    // Priority 2: If no current_location coordinates, use first stop
    if (center.lat === 0 && center.lng === 0) {
        if (stops.length > 0 && stops[0].lat && stops[0].lon) {
            center = { lat: stops[0].lat, lng: stops[0].lon };
        }
        // Priority 3: If no stops, use route geometry
        else if (routeGeometry.length > 0) {
            const [lat, lon] = routeGeometry[0];
            center = { lat, lng: lon };
        }
    }

    // If we have multiple points, adjust zoom to fit all
    if (stops.length > 1 || routeGeometry.length > 10) {
        zoom = 6; // Zoom out to see more area
    }

    return (
        <main className="flex flex-col h-full bg-white shadow-inner">
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden m-2">
                <div className="h-full w-full">
                    <MapContainer
                        center={center}
                        zoom={zoom}
                        style={{ height: '100%', width: '100%' }}
                        key={`${center.lat}-${center.lng}`} // Force re-render when center changes
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                        />

                        {/* Route polyline */}
                        {routeGeometry.length > 1 && (
                            <Polyline
                                positions={routeGeometry.map(([lat, lon]) => [lat, lon])}
                                color="blue"
                                weight={4}
                                opacity={0.7}
                            />
                        )}

                        {/* Current location marker (if it has coordinates) */}
                        {trip.current_location && trip.current_location.lat &&
                            (trip.current_location.lng || trip.current_location.lon) && (
                                <Marker
                                    position={{
                                        lat: trip.current_location.lat,
                                        lng: trip.current_location.lng || trip.current_location.lon
                                    }}
                                    icon={markerIcons.current}
                                >
                                    <Popup>
                                        <strong>Current Location</strong><br />
                                        {typeof trip.current_location === 'string' ? trip.current_location : 'Your Location'}
                                    </Popup>
                                </Marker>
                            )}

                        {/* Trip stops */}
                        {stops.map((stop) => {
                            if (!stop.lat || !stop.lon) return null;
                            let icon = markerIcons.fuel; // default to fuel (grey)
                            if (stop.type === 'current') icon = markerIcons.current;
                            else if (stop.type === 'pickup') icon = markerIcons.pickup;
                            else if (stop.type === 'dropoff') icon = markerIcons.dropoff;
                            else if (stop.type === 'break') icon = markerIcons.break;
                            else if (stop.type === 'fuel') icon = markerIcons.fuel;
                            // fallback: if type is unknown, use grey
                            return (
                                <Marker key={stop.id} position={{ lat: stop.lat, lng: stop.lon }} icon={icon}>
                                    <Popup>
                                        {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)} Stop<br />
                                        {stop.location} <br />
                                        {stop.arrival_time && `Arrive: ${stop.arrival_time}`} <br />
                                        {stop.duration_hours && `Duration: ${stop.duration_hours}h`}
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>
        </main>
    );
}

export default MapView;
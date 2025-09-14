import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

function MapView({ trip }) {
    if (!trip) return null;

    const stops = trip.stops || [];
    const routeGeometry = trip.route_geometry || [];

    // Center map:
    // 1. If there are stops, center on the first stop
    // 2. Otherwise, if route geometry exists, center on its first point
    // 3. Fallback: (0,0)
    let center = { lat: 0, lng: 0 };
    if (stops.length > 0 && stops[0].lat && stops[0].lon) {
        center = { lat: stops[0].lat, lng: stops[0].lon };
    } else if (routeGeometry.length > 0) {
        const [lat, lon] = routeGeometry[0];
        center = { lat, lng: lon };
    }

    return (
        <div style={{ height: '400px', width: '100%' }}>
            <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                {/* Route polyline */}
                {routeGeometry.length > 1 && (
                    <Polyline positions={routeGeometry.map(([lat, lon]) => [lat, lon])} color="blue" />
                )}

                {/* Trip stops */}
                {stops.map((stop) => {
                    if (!stop.lat || !stop.lon) return null;
                    return (
                        <Marker key={stop.id} position={{ lat: stop.lat, lng: stop.lon }}>
                            <Popup>
                                {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)} Stop<br />
                                {stop.location} <br />
                                Arrive: {stop.arrival_time} <br />
                                Duration: {stop.duration_hours}h
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapView;

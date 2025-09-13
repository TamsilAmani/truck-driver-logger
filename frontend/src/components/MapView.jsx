
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';


function MapView({ trip }) {
    if (!trip) return null;

    // Use coordinates from API response
    const currentLoc = trip.current_location_coords && trip.current_location_coords.lat && trip.current_location_coords.lon
        ? { lat: trip.current_location_coords.lat, lng: trip.current_location_coords.lon }
        : null;

    const stops = trip.stops || [];
    const stopCoords = trip.stop_coords || {};


    // Route geometry, fuel stops, and break stops from API
    const routeGeometry = trip.route_geometry || [];
    const fuelStops = trip.fuel_stops || [];
    const breakStops = trip.break_stops || [];

    // Center on current location, fallback to first stop with coords
    let center = currentLoc;
    if (!center && stops.length > 0) {
        const firstStop = stops[0];
        const coords = stopCoords[firstStop.id];
        if (coords && coords.lat && coords.lon) {
            center = { lat: coords.lat, lng: coords.lon };
        } else {
            center = { lat: 0, lng: 0 };
        }
    }
    if (!center) center = { lat: 0, lng: 0 };

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
                {/* Current location marker */}
                {currentLoc && (
                    <Marker position={currentLoc}>
                        <Popup>Current Location</Popup>
                    </Marker>
                )}
                {/* Trip stops */}
                {stops.map((stop) => {
                    const coords = stopCoords[stop.id];
                    if (!coords || !coords.lat || !coords.lon) return null;
                    return (
                        <Marker key={stop.id} position={{ lat: coords.lat, lng: coords.lon }}>
                            <Popup>{stop.type.charAt(0).toUpperCase() + stop.type.slice(1)} Stop<br />{stop.location}</Popup>
                        </Marker>
                    );
                })}
                {/* Fuel stops */}
                {fuelStops.map((fs, idx) => (
                    <Marker key={`fuel-${idx}`} position={{ lat: fs.lat, lng: fs.lon }}>
                        <Popup>Fuel Stop #{fs.order_index}</Popup>
                    </Marker>
                ))}
                {/* Break stops */}
                {breakStops.map((bs, idx) => (
                    <Marker key={`break-${idx}`} position={{ lat: bs.lat, lng: bs.lon }}>
                        <Popup>Mandatory Break #{bs.order_index} (8hr driving)</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

export default MapView;

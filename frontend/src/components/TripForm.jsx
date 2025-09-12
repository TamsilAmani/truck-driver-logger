import { useState } from "react";

function TripForm({ onPlan }) {
    const [currentLocation, setCurrentLocation] = useState("");
    const [pickupLocation, setPickupLocation] = useState("");
    const [dropoffLocation, setDropoffLocation] = useState("");
    const [cycleUsed, setCycleUsed] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            current_location: currentLocation,
            pickup_location: pickupLocation,
            dropoff_location: dropoffLocation,
            current_cycle_used: Number(cycleUsed),
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/plan/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to plan trip");
            }

            const data = await response.json();
            onPlan(data); // send to parent
        } catch (err) {
            console.error(err);
            alert("Error planning trip");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Plan a Trip</h2>

            <label>
                Current Location:
                <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    required
                />
            </label>
            <br />

            <label>
                Pickup Location:
                <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    required
                />
            </label>
            <br />

            <label>
                Dropoff Location:
                <input
                    type="text"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    required
                />
            </label>
            <br />

            <label>
                Current Cycle Used (hrs):
                <input
                    type="number"
                    value={cycleUsed}
                    onChange={(e) => setCycleUsed(e.target.value)}
                />
            </label>
            <br />

            <button type="submit">Plan Trip</button>
        </form>
    );
}

export default TripForm;

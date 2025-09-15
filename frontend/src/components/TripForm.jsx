import { useState } from "react";

function TripForm({ onPlan }) {
    const [currentLocation, setCurrentLocation] = useState("");
    const [pickupLocation, setPickupLocation] = useState("");
    const [dropoffLocation, setDropoffLocation] = useState("");
    const [cycleUsed, setCycleUsed] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            current_location: currentLocation,
            pickup_location: pickupLocation,
            dropoff_location: dropoffLocation,
            current_cycle_used: Number(cycleUsed),
        };

        try {
            const API_URL = process.env.REACT_APP_API_URL;
            console.log("API URL:", process.env.REACT_APP_API_URL);
            const response = await fetch(`${API_URL}/api/plan/`, {
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Plan a Trip</h2>
                <p className="text-gray-600 text-sm">Enter your trip details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Location */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Current Location
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={currentLocation}
                            onChange={(e) => setCurrentLocation(e.target.value)}
                            required
                            placeholder="e.g., Delhi"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pickup Location */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Pickup Location
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            required
                            placeholder="e.g., Pune"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 placeholder-gray-400"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Dropoff Location */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Dropoff Location
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={dropoffLocation}
                            onChange={(e) => setDropoffLocation(e.target.value)}
                            required
                            placeholder="e.g., Agra"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 placeholder-gray-400"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Current Cycle Used */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Current Cycle Used (hours)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={cycleUsed}
                            onChange={(e) => setCycleUsed(e.target.value)}
                            placeholder="e.g., 3"
                            min="0"
                            step="0.1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 transform ${isLoading
                        ? 'bg-blue-100 text-blue-700 cursor-not-allowed' // lighter background, visible text
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-white'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-blue-700 font-semibold">Planning Trip...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                            </svg>
                            Plan Trip
                        </div>
                    )}
                </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                    <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                        <p className="text-sm text-blue-800 font-medium">Planning Tips</p>
                        <p className="text-xs text-blue-600 mt-1">
                            Enter specific city names for better routing. The system will calculate optimal stops and timing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TripForm;
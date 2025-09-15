function TripResults({ trip, onShowLogs }) {
    if (!trip) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">No trip planned yet</p>
                <p className="text-gray-400 text-sm mt-2">Plan a trip to see detailed results and route information</p>
            </div>
        );
    }

    const stops = trip.stops || [];
    const distance = trip.route_distance_m ? (trip.route_distance_m / 1609.34).toFixed(1) : "--";
    const duration = trip.route_duration_s ? (trip.route_duration_s / 3600).toFixed(1) : "--";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Trip Results</h2>
                    <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Planned
                    </div>
                </div>

                <div className="text-sm text-gray-600">
                    Trip ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{trip.id}</span>
                </div>
            </div>

            {/* Route Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                    Route Overview
                </h3>

                {/* Location Flow */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Current Location</p>
                            <p className="text-gray-800 font-semibold">{trip.current_location}</p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pickup Location</p>
                            <p className="text-gray-800 font-semibold">{trip.pickup_location}</p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Dropoff Location</p>
                            <p className="text-gray-800 font-semibold">{trip.dropoff_location}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                            <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-blue-600">Distance</p>
                                <p className="text-xl font-bold text-blue-800">{distance} mi</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center">
                            <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-purple-600">Duration</p>
                                <p className="text-xl font-bold text-purple-800">{duration} hrs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stops Section */}
            {stops.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scheduled Stops ({stops.length})
                    </h3>

                    <div className="space-y-3">
                        {stops.map((stop, index) => (
                            <div key={stop.id || index} className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-150">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                                    </div>
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-800 capitalize">{stop.type} Stop</p>
                                        {stop.duration_hours && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                {stop.duration_hours}h
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mt-1">{stop.location}</p>
                                    {stop.arrival_time && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Arrival: {stop.arrival_time}
                                        </p>
                                    )}
                                    {stop.lat && stop.lon && (
                                        <p className="text-xs text-gray-400 mt-1 font-mono">
                                            {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <button
                    onClick={onShowLogs}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                    <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Log Sheets
                    </div>
                </button>
            </div>
        </div>
    );
}

export default TripResults;
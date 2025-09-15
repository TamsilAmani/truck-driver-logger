import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { useRef, useState } from 'react';

function LogSheetDrawer({ trip, onClose }) {
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
    const dailyLogRef = useRef(null);

    if (!trip || !trip.logsheets) return null;

    const currentSheet = trip.logsheets[currentSheetIndex];

    // Generate 24-hour grid with 4 quarter-hour segments each
    const generateTimeGrid = () => {
        const grid = [];
        for (let hour = 0; hour < 24; hour++) {
            grid.push(hour);
        }
        return grid;
    };

    const timeGrid = generateTimeGrid();

    // Map events to grid based on time and status
    const mapEventsToGrid = (events) => {
        const eventGrid = {
            'off_duty': Array(96).fill(false),
            'sleeper': Array(96).fill(false),
            'driving': Array(96).fill(false),
            'on_duty': Array(96).fill(false)
        };

        if (!events) return eventGrid;

        events.forEach((event) => {
            if (!event.start_time) return;

            const startDate = new Date(event.start_time);
            const endDate = event.end_time ? new Date(event.end_time) : null;

            if (isNaN(startDate.getTime())) return;

            const startHour = startDate.getUTCHours();
            const startMinute = startDate.getUTCMinutes();
            const startQuarter = Math.floor(startMinute / 15);
            const startIndex = startHour * 4 + startQuarter;

            let endIndex = startIndex + 1; // Default 15 minutes
            if (endDate && !isNaN(endDate.getTime())) {
                const endHour = endDate.getUTCHours();
                const endMinute = endDate.getUTCMinutes();
                const endQuarter = Math.floor(endMinute / 15);
                endIndex = Math.min(95, endHour * 4 + endQuarter);
            }

            // Map status to grid row
            const status = event.status.toLowerCase();
            let gridRow = 'on_duty'; // default
            if (status.includes('off') || status.includes('break') || status.includes('rest')) {
                gridRow = 'off_duty';
            } else if (status.includes('sleep') || status.includes('sleeper')) {
                gridRow = 'sleeper';
            } else if (status.includes('driv')) {
                gridRow = 'driving';
            }

            // Fill the grid for the duration
            for (let i = startIndex; i < endIndex && i < 96; i++) {
                eventGrid[gridRow][i] = true;
            }
        });

        return eventGrid;
    };

    const eventGrid = mapEventsToGrid(currentSheet?.sheet_json?.events);

    const downloadCurrentSheet = async () => {
        if (dailyLogRef.current) {
            try {
                // Try to use html2canvas if available
                const html2canvas = (await import('html2canvas')).default;
                const canvas = await html2canvas(dailyLogRef.current, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    allowTaint: true
                });

                const link = document.createElement('a');
                link.download = `daily-log-${currentSheet.date}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (error) {
                console.error('html2canvas not available:', error);
                // Fallback to print
                window.print();
            }
        }
    };

    const downloadAllSheets = () => {
        alert('Generating PDF with all sheets... (TO DO)');
    };

    const navigateSheet = (direction) => {
        if (direction === 'prev' && currentSheetIndex > 0) {
            setCurrentSheetIndex(currentSheetIndex - 1);
        } else if (direction === 'next' && currentSheetIndex < trip.logsheets.length - 1) {
            setCurrentSheetIndex(currentSheetIndex + 1);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 flex justify-center items-center animate-in fade-in duration-300"
            style={{ zIndex: 10000 }}
            onClick={onClose}
        >
            <div
                className="w-[95%] h-[95%] bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Controls */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 shadow-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Driver's Daily Log
                            </h2>
                            <p className="text-slate-300 text-sm">Sheet {currentSheetIndex + 1} of {trip.logsheets.length}</p>
                        </div>

                        {/* Navigation */}
                        {trip.logsheets.length > 1 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => navigateSheet('prev')}
                                    disabled={currentSheetIndex === 0}
                                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5 text-black" />
                                </button>
                                <span className="text-white text-sm px-2">{currentSheet.date}</span>
                                <button
                                    onClick={() => navigateSheet('next')}
                                    disabled={currentSheetIndex === trip.logsheets.length - 1}
                                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5 text-black" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Download Buttons */}
                        <button
                            onClick={downloadCurrentSheet}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-black rounded-lg transition-colors duration-200 text-sm flex items-center"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            Download Sheet
                        </button>

                        {trip.logsheets.length > 1 && (
                            <button
                                onClick={downloadAllSheets}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-black rounded-lg transition-colors duration-200 text-sm flex items-center"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Download All
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-600 rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 text-slate-300 hover:text-white" fill="none" stroke="red" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* DOT Log Sheet - Exact Replica */}
                <div className="h-full overflow-y-auto pb-4">
                    <div ref={dailyLogRef} className="p-6 bg-white min-h-full" style={{ fontFamily: 'Arial, sans-serif' }}>

                        {/* Header Section */}
                        <div className="text-center mb-4">
                            <h1 className="text-xl font-bold">Driver's Daily Log</h1>
                            <div className="text-sm mt-1">
                                <span className="mr-8">Date: {currentSheet.date}</span>
                                <span className="mr-8">Month: {new Date(currentSheet.date).toLocaleDateString('en-US', { month: 'long' })}</span>
                                <span className="mr-8">Day: {new Date(currentSheet.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                <span className="mr-8">Year: {new Date(currentSheet.date).getFullYear()}</span>
                                <span>Original - File at home terminal</span>
                            </div>
                            <div className="text-sm mt-1">
                                <span>Duplicate - Driver retains for his own records for 3 days</span>
                            </div>
                        </div>

                        {/* Driver Info Section */}
                        <div className="grid grid-cols-2 gap-8 mb-4 text-sm">
                            <div>
                                <div className="mb-2">
                                    <span>From: </span>
                                    <span className="border-b border-black inline-block w-40">{trip.pickup_location || ""}</span>
                                    <span className="ml-4">To: </span>
                                    <span className="border-b border-black inline-block w-40">{trip.dropoff_location || ""}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border border-black p-2 h-16">
                                        <div className="text-xs mb-1">Total Miles Driving Today</div>
                                        <div className="text-base font-bold mt-2">
                                            {trip.route_distance_m
                                                ? (trip.route_distance_m / 1609.344).toFixed(2) + ' mi'
                                                : '--'}
                                        </div>
                                    </div>
                                    <div className="border border-black p-2 h-16">
                                        <div className="text-xs mb-1">Total Mileage Today</div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-xs">Truck/Tractor and Trailer Numbers or</div>
                                    <div className="text-xs">License Plate(s)/State (Show each unit)</div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2">
                                    <span>Name of Carrier or Carriers: </span>
                                    <span className="border-b border-black inline-block w-48">Spotter AI</span>
                                </div>
                                <div className="mb-2">
                                    <span>Main Office Address: </span>
                                    <span className="border-b border-black inline-block w-56">123 Main St, Chicago, IL 60601</span>
                                </div>
                                <div>
                                    <span>Home Terminal Address: </span>
                                    <span className="border-b border-black inline-block w-56">Terminal Ave, Chicago, IL 60602</span>
                                </div>
                            </div>
                        </div>

                        {/* Time Grid Section */}
                        <div className="mb-4">
                            {/* Hour Labels */}
                            <div className="flex">
                                <div className="w-20 text-center text-xs font-bold border border-black p-1">HOURS</div>
                                {timeGrid.map((hour) => (
                                    <div key={hour} className="w-16 text-center text-xs font-bold border border-black p-1">
                                        {hour.toString().padStart(2, '0')}
                                    </div>
                                ))}
                                <div className="w-16 text-center text-xs font-bold border border-black p-1 bg-yellow-100">Total</div>
                            </div>

                            {/* Status Rows */}
                            {[
                                { label: '1. Off Duty', key: 'off_duty' },
                                { label: '2. Sleeper', key: 'sleeper' },
                                { label: '3. Driving', key: 'driving' },
                                { label: '4. On Duty', key: 'on_duty' }
                            ].map((statusRow) => {
                                // Calculate total time for this status
                                const totalQuarters = eventGrid[statusRow.key].filter(Boolean).length;
                                const totalHours = Math.floor(totalQuarters / 4);
                                const totalMinutes = (totalQuarters % 4) * 15;
                                const timeDisplay = totalHours > 0
                                    ? `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`
                                    : totalMinutes > 0
                                        ? `0:${totalMinutes.toString().padStart(2, '0')}`
                                        : '0:00';

                                return (
                                    <div key={statusRow.key} className="flex">
                                        <div className="w-20 text-xs font-bold border border-black p-1 flex items-center">
                                            {statusRow.label}
                                        </div>
                                        {timeGrid.map((hour) => (
                                            <div key={hour} className="w-16 border border-black">
                                                <div className="h-8 flex">
                                                    {Array.from({ length: 4 }, (_, quarter) => {
                                                        const gridIndex = hour * 4 + quarter;
                                                        const isActive = eventGrid[statusRow.key][gridIndex];
                                                        return (
                                                            <div
                                                                key={quarter}
                                                                className={`flex-1 h-full border-r border-gray-400 last:border-r-0 ${isActive ? 'bg-black' : ''}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {/* 24th column for total time */}
                                        <div className="w-16 text-xs font-bold border border-black p-1 flex items-center justify-center bg-gray-50">
                                            {timeDisplay}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Total Sum Row */}
                            <div className="flex">
                                <div className="w-20 text-xs font-bold border border-black p-1 flex items-center bg-yellow-100">
                                    TOTAL
                                </div>
                                {timeGrid.map((hour) => (
                                    <div key={hour} className="w-16 border border-black bg-gray-100">
                                        <div className="h-6"></div>
                                    </div>
                                ))}
                                {/* 24th column for grand total */}
                                <div className="w-16 text-xs font-bold border border-black p-1 flex items-center justify-center bg-yellow-100">
                                    {(() => {
                                        const totalQuarters = ['off_duty', 'sleeper', 'driving', 'on_duty']
                                            .reduce((sum, key) => sum + eventGrid[key].filter(Boolean).length, 0);
                                        const totalHours = Math.floor(totalQuarters / 4);
                                        const totalMinutes = (totalQuarters % 4) * 15;
                                        return totalHours > 0
                                            ? `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`
                                            : totalMinutes > 0
                                                ? `0:${totalMinutes.toString().padStart(2, '0')}`
                                                : '0:00';
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Remarks and Shipping Documents */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="border border-black">
                                <div className="bg-gray-100 p-2 font-bold text-sm border-b border-black">
                                    Remarks
                                </div>
                                <div className="p-2 h-24 text-xs">
                                    {currentSheet.sheet_json?.events?.map((event, idx) =>
                                        event.note ? `${event.status_display}: ${event.note}` : null
                                    ).filter(Boolean).join('; ')}
                                </div>
                            </div>
                            <div className="border border-black">
                                <div className="bg-gray-100 p-2 font-bold text-sm border-b border-black">
                                    Shipping Documents
                                </div>
                                <div className="p-2 h-24 text-xs">
                                    <div className="mb-2">
                                        <span>Bill of Lading No.: </span>
                                        <span className="border-b border-black inline-block w-24">{trip.id || ""}</span>
                                    </div>
                                    <div>
                                        <div>Shipper & Commodity:</div>
                                        <div>Enter name of place you reported to</div>
                                        <div>where where released from work and where each change of duty occurred</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Summary Table */}
                        <div className="border border-black">
                            <div className="grid grid-cols-8 text-xs">
                                {/* Headers */}
                                <div className="border-r border-black p-2 font-bold">
                                    <div>Recap:</div>
                                    <div>Totals for</div>
                                    <div>24 Hours</div>
                                </div>
                                <div className="border-r border-black p-2 font-bold">
                                    <div>(1) Hours/</div>
                                    <div>Day Driving</div>
                                </div>
                                <div className="border-r border-black p-2 font-bold">
                                    <div>(2) Hours/</div>
                                    <div>Hours on</div>
                                    <div>duty today</div>
                                </div>
                                <div className="border-r border-black p-2 font-bold">
                                    <div>(3) Total/</div>
                                    <div>consecutive</div>
                                    <div>hours off duty</div>
                                </div>
                                <div className="border-r border-black p-2 font-bold">
                                    <div>(4) Sleeper/</div>
                                    <div>berth time</div>
                                </div>
                                <div className="border-r border-black p-2 font-bold">
                                    <div>7-8 days/</div>
                                    <div>Hours on</div>
                                    <div>duty total</div>
                                </div>
                                <div className="border-r border-black p-2 font-bold">
                                    <div>6: Total</div>
                                    <div>Hours on</div>
                                    <div>duty today</div>
                                </div>
                                <div className="p-2 font-bold">
                                    <div>76 hrs total</div>
                                    <div>consecutive</div>
                                    <div>hours off duty</div>
                                </div>

                                {/* Data Rows */}
                                <div className="border-r border-t border-black p-2">
                                    <div>On duty</div>
                                    <div>hours</div>
                                    <div>today</div>
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    8
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    10
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    8
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    0
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    55
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    10
                                </div>
                                <div className="border-t border-black p-2 text-center">
                                    10
                                </div>

                                <div className="border-r border-t border-black p-2">
                                    <div>Miles</div>
                                    <div>driven</div>
                                    <div>today</div>
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    485
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    485
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    8
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    0
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    3240
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    485
                                </div>
                                <div className="border-t border-black p-2 text-center">
                                    8
                                </div>

                                <div className="border-r border-t border-black p-2">
                                    <div>Total Hours</div>
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    8.5
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    10
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    8
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    0
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    65
                                </div>
                                <div className="border-r border-t border-black p-2 text-center">
                                    10
                                </div>
                                <div className="border-t border-black p-2 text-center">
                                    8
                                </div>
                            </div>
                        </div>

                        {/* Driver Signature Section */}
                        <div className="mt-4 flex justify-between items-end text-sm">
                            <div>
                                <div className="mb-2">Driver's signature certifying that the record is true and complete.</div>
                                <div className="border-b border-black w-64 h-6"></div>
                                <div className="text-xs mt-1">Driver's Signature</div>
                            </div>
                            <div>
                                <div className="mb-2">24-Hour Period (Midnight to Midnight)</div>
                                <div className="border-b border-black w-32 h-6"></div>
                                <div className="text-xs mt-1">Date</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LogSheetDrawer;
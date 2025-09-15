import { useState } from "react";
import LogSheetDrawer from "./components/LogSheetDrawer.jsx";
import MapView from "./components/MapView.jsx";
import TripForm from "./components/TripForm.jsx";
import TripResults from "./components/TripResults.jsx";

function App() {
  const [trip, setTrip] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  return (
    <>
      <div className="h-screen overflow-hidden grid grid-cols-[20%_50%_30%] bg-slate-50">
        {/* Left Sidebar - 20% */}
        <aside className="p-6 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
          <TripForm onPlan={setTrip} />
        </aside>

        {/* Center Map - 60% */}
        <main className="flex flex-col h-full">
          {trip ? (
            <MapView trip={trip} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
              Plan a trip to see the map
            </div>
          )}
        </main>

        {/* Right Sidebar - 20% */}
        <aside className="p-6 bg-white border-l border-gray-200 shadow-sm overflow-y-auto">
          <TripResults trip={trip} onShowLogs={() => setShowLogs(true)} />
        </aside>
      </div>

      {/* Log Sheet Drawer - Outside the grid container */}
      {showLogs && <LogSheetDrawer trip={trip} onClose={() => setShowLogs(false)} />}
    </>
  );
}

export default App;

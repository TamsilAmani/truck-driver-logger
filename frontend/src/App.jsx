import { useState } from "react";
import MapView from "./components/MapView";
import TripForm from "./components/TripForm";
import TripResults from "./components/TripResults";

function App() {
  const [trip, setTrip] = useState(null);

  return (
    <div>
      <h1>Truck Driver Trip Planner</h1>
      <TripForm onPlan={setTrip} />
      <TripResults trip={trip} />
      <MapView trip={trip} />
    </div>
  );
}

export default App;

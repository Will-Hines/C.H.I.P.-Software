import { useEffect, useState } from "react";
import "./App.css";
import robotImage from "./assets/CHIPlogo.png";
import mapImage from "./assets/facility_map_example.png";

function App() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [showAlert, setShowAlert] = useState(true);
  const [alertHistory, setAlertHistory] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://c-h-i-p-software.onrender.com/robot-data"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch robot data");
      }

      const result = await response.json();
      setData(Array.isArray(result) ? [...result].reverse() : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const latest = data.length > 0 ? data[0] : null;

  const dismissAlert = () => {
    if (!latest) return;

    const newAlert = {
      id: latest.timestamp,
      message: "Spill Detected!",
      timestamp: latest.timestamp,
      robot_id: latest.robot_id,
      battery: latest.battery,
    };

    setAlertHistory((prev) => {
      const alreadyExists = prev.some((alert) => alert.id === newAlert.id);
      if (alreadyExists) return prev;
      return [newAlert, ...prev];
    });

    setShowAlert(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo-title">
          <img src={robotImage} alt="C.H.I.P." className="logo" />
          <span className="title">C.H.I.P.</span>
        </div>

        <nav className="tabs">
          <button onClick={() => setActiveTab("home")}>Home</button>
          <button onClick={() => setActiveTab("map")}>Map</button>
          <button onClick={() => setActiveTab("alerts")}>Alert History</button>
        </nav>
      </header>

      <div className="content">
        {activeTab === "home" && (
          <div>
            <h2>System Overview</h2>

            {latest ? (
              <div className="status-card">
                <strong>Latest Robot {latest.robot_id} Status</strong>
                <br />
                Timestamp: {new Date(latest.timestamp).toLocaleString()}
                <br />
                Battery: {latest.battery}%
              </div>
            ) : (
              <div className="status-card">Loading robot data...</div>
            )}

            <h2>Current Alerts</h2>

            {latest ? (
              showAlert ? (
                <div className="new-alert-card">
                  <span
                    className="close-alert"
                    onClick={dismissAlert}
                    aria-label="Dismiss alert"
                    title="Dismiss"
                  >
                    ×
                  </span>
                  <strong>Spill Detected!</strong>
                  <br />
                  Timestamp: {new Date(latest.timestamp).toLocaleString()}
                </div>
              ) : (
                <div className="alert-item past">No current alerts.</div>
              )
            ) : (
              <div className="alert-item past">Loading alerts...</div>
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div>
            <h2>Map of Facility</h2>
            <img src={mapImage} alt="Facility Map" className="map-image" />
          </div>
        )}

        {activeTab === "alerts" && (
          <div>
            <h2>Alert History</h2>
            {alertHistory.length > 0 ? (
              alertHistory.map((alert) => (
                <div key={alert.id} className="alert-item">
                  <strong>{alert.message}</strong>
                  <br />
                  Timestamp: {new Date(alert.timestamp).toLocaleString()}
                  <br />
                  Robot: {alert.robot_id}
                  <br />
                  Battery: {alert.battery}%
                </div>
              ))
            ) : (
              <div className="alert-item past">No alert history available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";
import "./App.css";
import robotImage from "./assets/CHIPlogo.png";
import mapImage from "./assets/facility_map_example.png";

function App() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [alertHistory, setAlertHistory] = useState([]);

  const BASE_URL = "https://c-h-i-p-software.onrender.com";
  // for local testing use:
  // const BASE_URL = "http://127.0.0.1:8000";

  const fetchData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/robot-data`);

      if (!response.ok) {
        throw new Error("Failed to fetch current alerts");
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        const sortedData = [...result].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setData(sortedData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching current alerts:", error);
      setData([]);
    }
  };

  const fetchPreviousAlerts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/previous-alerts`);

      if (!response.ok) {
        throw new Error("Failed to fetch previous alerts");
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        const sortedHistory = [...result].sort(
          (a, b) =>
            new Date(b.dismissed_at || b.timestamp) -
            new Date(a.dismissed_at || a.timestamp)
        );
        setAlertHistory(sortedHistory);
      } else {
        setAlertHistory([]);
      }
    } catch (error) {
      console.error("Error fetching previous alerts:", error);
      setAlertHistory([]);
    }
  };

  const dismissAlert = async (alertItem) => {
    try {
      const response = await fetch(`${BASE_URL}/dismiss-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: alertItem._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss alert");
      }

      await fetchData();
      await fetchPreviousAlerts();
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPreviousAlerts();

    const interval = setInterval(() => {
      fetchData();
      fetchPreviousAlerts();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const latest = data.length > 0 ? data[0] : null;

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
                <br />
                Temperature: {latest.temperature}°C
              </div>
            ) : (
              <div className="status-card">Loading robot data...</div>
            )}

            <h2>Current Alerts</h2>

            {data.length > 0 ? (
              data.map((item) => (
                <div key={item._id} className="new-alert-card">
                  <span
                    className="close-alert"
                    onClick={() => dismissAlert(item)}
                    aria-label="Dismiss alert"
                    title="Dismiss"
                  >
                    ×
                  </span>

                  <strong>Spill Detected!</strong>
                  <br />
                  Timestamp: {new Date(item.timestamp).toLocaleString()}
                  <br />
                  Robot: {item.robot_id}
                  <br />
                  Battery: {item.battery}%
                  <br />
                  Temperature: {item.temperature}°C
                  <br />
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Current alert"
                      className="alert-image"
                      onClick={() => window.open(item.image_url, "_blank")}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="alert-item past">No current alerts.</div>
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
                <div key={alert._id} className="alert-item">
                  <strong>Spill Detected!</strong>
                  <br />
                  Timestamp: {new Date(alert.timestamp).toLocaleString()}
                  <br />
                  Dismissed:{" "}
                  {alert.dismissed_at
                    ? new Date(alert.dismissed_at).toLocaleString()
                    : "Not available"}
                  <br />
                  Robot: {alert.robot_id}
                  <br />
                  Battery: {alert.battery}%
                  <br />
                  Temperature: {alert.temperature}°C
                  <br />
                  {alert.image_url && (
                    <img
                      src={alert.image_url}
                      alt="Alert history"
                      className="alert-image"
                      onClick={() => window.open(alert.image_url, "_blank")}
                    />
                  )}
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

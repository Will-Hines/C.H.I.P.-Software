import { useEffect, useState } from "react";
import "./App.css";
import robotImage from "./assets/CHIPlogo.png";
import mapImage from "./assets/facility_map_example.png";

function App() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [alertHistory, setAlertHistory] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://c-h-i-p-software.onrender.com/robot-data"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch robot data");
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        const sortedData = [...result].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        const uniqueData = sortedData.filter((item, index, self) => {
          const id = `${item.timestamp}-${item.robot_id}-${item.battery}`;
          return (
            index ===
            self.findIndex(
              (x) =>
                `${x.timestamp}-${x.robot_id}-${x.battery}` === id
            )
          );
        });

        const filteredData = uniqueData.filter(
          (item) =>
            !dismissedAlerts.includes(
              `${item.timestamp}-${item.robot_id}-${item.battery}`
            )
        );

        setData(filteredData);
      } else {
        setData([]);
      }
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

  const dismissAlert = (alertItem) => {
    const alertId = `${alertItem.timestamp}-${alertItem.robot_id}-${alertItem.battery}`;

    const newAlert = {
      id: alertId,
      message: "Spill Detected!",
      timestamp: alertItem.timestamp,
      robot_id: alertItem.robot_id,
      battery: alertItem.battery,
    };

    setAlertHistory((prev) => {
      const alreadyExists = prev.some((alert) => alert.id === newAlert.id);
      if (alreadyExists) return prev;
      return [newAlert, ...prev];
    });

    setDismissedAlerts((prev) => {
      if (prev.includes(alertId)) return prev;
      return [...prev, alertId];
    });

    setData((prev) =>
      prev.filter(
        (item) =>
          `${item.timestamp}-${item.robot_id}-${item.battery}` !== alertId
      )
    );
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

            {data.length > 0 ? (
              data.map((item) => (
                <div
                  key={`${item.timestamp}-${item.robot_id}-${item.battery}`}
                  className="new-alert-card"
                >
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

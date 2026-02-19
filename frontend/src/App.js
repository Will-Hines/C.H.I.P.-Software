import { useEffect, useState } from "react";
import "./App.css";
import robotImage from "./assets/CHIPlogo.png";

function App() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("home");

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://c-h-i-p-software.onrender.com/robot-data"
      );
      const result = await response.json();
      setData(result.reverse());
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

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo-title">
          <img src={robotImage} alt="C.H.I.P." className="logo" />
          <span className="title">C.H.I.P.</span>
        </div>

        <nav className="tabs">
          <button onClick={() => setActiveTab("home")}>
            Home
          </button>
          <button onClick={() => setActiveTab("map")}>
            Map
          </button>
          <button onClick={() => setActiveTab("alerts")}>
            Alert History
          </button>
        </nav>
      </header>

      {/* TAB CONTENT */}
      <div className="content">
        {activeTab === "home" && (
          <div>
            <h2>System Overview</h2>
            {latest && (
              <div className="status-card">
                Latest Robot {latest.robot_id} Status
                <br />
                Battery: {latest.battery}%
              </div>
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div>
            <h2>Map of Facility</h2>
            <img
              src={robotImage}
              alt="Map"
              className="map-image"
            />
          </div>
        )}

        {activeTab === "alerts" && (
          <div>
            <h2>Alert History</h2>
            {data.slice(0, 10).map((item, i) => (
              <div key={i} className="alert-item">
                {new Date(item.timestamp).toLocaleString()} :
                Battery {item.battery}%
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;

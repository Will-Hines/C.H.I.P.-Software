import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://c-h-i-p-software.onrender.com/robot-data"
      );
      const result = await response.json();
      setData(result.reverse()); // newest first
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // auto refresh every 3 sec
    return () => clearInterval(interval);
  }, []);

  const latest = data.length > 0 ? data[0] : null;

  return (
    <div className="container">
      <h1>🤖 Robot Telemetry Dashboard</h1>

      {latest && (
        <div className="status-card">
          <h2>Latest Status (Robot {latest.robot_id})</h2>
          <div className="status-grid">
            <div>
              <span className="label">Battery:</span>
              <span
                className={
                  latest.battery < 30 ? "value danger" : "value good"
                }
              >
                {latest.battery}%
              </span>
            </div>

            <div>
              <span className="label">Temperature:</span>
              <span className="value">{latest.temperature}°C</span>
            </div>

            <div>
              <span className="label">Speed:</span>
              <span className="value">{latest.speed}</span>
            </div>

            <div>
              <span className="label">Timestamp:</span>
              <span className="value">
                {new Date(latest.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <h2>Telemetry History</h2>

      {data.length === 0 ? (
        <p>No data yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Robot ID</th>
              <th>Battery (%)</th>
              <th>Temperature (°C)</th>
              <th>Speed</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.robot_id}</td>
                <td
                  className={
                    item.battery < 30 ? "danger-text" : ""
                  }
                >
                  {item.battery}
                </td>
                <td>{item.temperature}</td>
                <td>{item.speed}</td>
                <td>
                  {new Date(item.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;

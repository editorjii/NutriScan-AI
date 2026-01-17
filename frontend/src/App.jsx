import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState("General Health");
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get-history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleScan = async () => {
    if (!file) return alert("Please upload a photo first!");
    setLoading(true);
    setAnalysis("");

    const formData = new FormData();
    formData.append('foodImage', file);
    formData.append('userGoal', goal);

    try {
      const response = await fetch('http://localhost:5000/api/scan-food', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        fetchHistory(); 
      } else {
        setAnalysis("❌ Error: " + data.error);
      }
    } catch (error) {
      setAnalysis("❌ Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>🥗 NutriScan AI</h1>

      {/* --- DAILY SUMMARY CARD (Moved inside the main div) --- */}
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
        padding: '20px', 
        borderRadius: '20px', 
        marginBottom: '25px', 
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' 
      }}>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, color: 'white' }}>Total Calories Today</p>
        <h2 style={{ margin: '5px 0', fontSize: '36px', color: 'white' }}>
          {history.reduce((total, item) => total + (item.calories || 0), 0)} kcal
        </h2>
        <div style={{ fontSize: '12px', color: '#ecfdf5' }}>
          {history.length} items logged
        </div>
      </div>
      
      {/* Goal Selection Card */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '20px', marginBottom: '20px', color: '#1a1a1a' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>🎯 My Goal:</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['General', 'Skin Glow', 'Weight Loss'].map((g) => (
            <button key={g} onClick={() => setGoal(g)} style={{ padding: '10px', borderRadius: '15px', border: 'none', backgroundColor: goal === g ? '#10b981' : '#e5e7eb', color: goal === g ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: 'bold' }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ border: '2px dashed #444', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} style={{ marginBottom: '15px', color: 'white' }} />
        <button onClick={handleScan} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
          {loading ? "Analyzing..." : "🔍 Scan Food"}
        </button>
      </div>

      {/* Latest Result */}
      {analysis && (
        <div style={{ padding: '20px', backgroundColor: 'white', color: '#1a1a1a', borderRadius: '20px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
          <h3 style={{ color: '#10b981', marginTop: 0 }}>Latest Report</h3>
          {analysis}
        </div>
      )}

      {/* --- HISTORY SECTION --- */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>🕒 Recent Scans</h3>
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #10b981' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.foodName}</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{new Date(item.date).toLocaleTimeString()}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#10b981' }}>{item.calories} kcal</div>
            </div>
          ))
        ) : (
          <p style={{ opacity: 0.5 }}>No scans yet today.</p>
        )}
      </div>
    </div>
  );
}

export default App;
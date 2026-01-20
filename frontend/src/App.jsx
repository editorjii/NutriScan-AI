import React, { useState, useRef, useEffect } from 'react';
import './App.css';
const API_BASE_URL = "https://nutriscan-ai-4889.onrender.com";

function App() {
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("minimalist");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [goals, setGoals] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [totalScans, setTotalScans] = useState(0);

useEffect(() => {
    fetch('https://nutriscan-ai-4889.onrender.com/api/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.log("History fetch failed"));
  }, [totalScans]);

  const resultRef = useRef(null);
  const availableGoals = ['Fat Loss', 'Weight Gain', 'Skin Issues', 'Digestion', 'Muscle Growth'];

  useEffect(() => {
    fetch('https://nutriscan-ai-4889.onrender.com/api/stats')
      .then(res => res.json())
      .then(data => setTotalScans(data.totalScans || 0))
      .catch(err => console.log("Stats fetch failed"));
  }, [result]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const toggleGoal = (goal) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    if (isCompareMode && files.length < 2) {
        alert("Please select 2 photos to compare!");
        return;
    }

    setLoading(true);
    setResult("");

    const formData = new FormData();
    files.forEach(file => formData.append('foodImage', file));
    formData.append('userGoal', goals.join(', ') || "General Health");

    try {
      const response = await fetch('https://nutriscan-ai-4889.onrender.com/api/scan-food', { 
        method: 'POST', 
        body: formData 
      });
      const data = await response.json();
      if (data.analysis) {
        setResult(data.analysis.replace(/\*\*/g, ''));
      }
    } catch (error) { 
      alert("Check if server is running!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const sendFeedback = async () => {
    if (!feedback) return;
    try {
      await fetch('https://nutriscan-ai-4889.onrender.com/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: feedback })
      });
      alert("Note received with love! ✨");
      setFeedback("");
    } catch (err) {
      alert("Could not send note.");
    }
  };
const logMeal = async (foodType) => {
  try {
    await fetch('https://nutriscan-ai-4889.onrender.com/api/save-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        foodName: foodType, // You can also extract the real name from 'result' if you want!
        goal: goals.join(', ') || "Balanced" 
      })
    });
    alert("Meal saved to your history! 🌿");
    // This will trigger the useEffect to refresh your scan count automatically!
    setResult(""); 
  } catch (err) {
    alert("Failed to save meal.");
  }
};
  return (
    <div className={`app-container ${theme}`}>
      
      {/* 1. SIDEBAR OVERLAY (Fixed placement) */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
{/* 2. SIDEBAR */}
<div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
  
  {/* Header: Title and Close Button */}
  <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h3 style={{ margin: 0 }}>NutriHistory</h3>
    <button className="close-btn" onClick={() => setSidebarOpen(false)} style={{ float: 'none' }}>✕</button>
  </div>

  {/* Middle: The Scrollable History Section */}
  <div className="history-container" style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
    <h4 style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>Recent Scans</h4>
    <div className="history-list">
      {history.length > 0 ? (
        history.map((item, index) => (
          <div key={index} className="history-item">
            <span className="history-name">{item.foodName}</span>
            <span className="history-date" style={{ fontSize: '0.7rem', opacity: 0.5 }}>
              {new Date(item.date).toLocaleDateString()}
            </span>
          </div>
        ))
      ) : (
        <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '10px' }}>No meals logged yet... 🌸</p>
      )}
    </div>
  </div>

  {/* Footer: Feedback and Theme Toggle */}
  <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
    <div className="sidebar-section feedback-box">
      <h4>Share your light</h4>
      <textarea 
        placeholder="How can we make your journey better?" 
        className="feedback-input"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        style={{ width: '100%', height: '80px', borderRadius: '10px', padding: '10px', marginTop: '10px', border: '1px solid #eee' }}
      />
      <button className="feedback-send-btn" onClick={sendFeedback} style={{ width: '100%', marginTop: '10px' }}>
        Send Note ✨
      </button>
    </div>

    <button className="theme-toggle-btn" 
      onClick={() => setTheme(theme === 'minimalist' ? 'healing' : 'minimalist')}
      style={{ width: '100%', marginTop: '20px' }}
    >
      Switch Mode
    </button>
  </div>
</div>

      <header className="header">
        <button className="menu-icon" onClick={() => setSidebarOpen(true)}>☰</button>
        <h1 className="logo">NutriScan AI</h1>
      </header>

      <main style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%'}}>
        <div className="power-hook">
          <h2>{isCompareMode ? "Choose the Lesser Evil." : "Scan food. Eat smarter."}</h2>
        </div>

        <div className="mode-selection-pills">
          <button className={`pill ${!isCompareMode ? 'active' : ''}`} onClick={() => setIsCompareMode(false)}>Single</button>
          <button className={`pill ${isCompareMode ? 'active' : ''}`} onClick={() => setIsCompareMode(true)}>Compare</button>
        </div>

        <div className="dashboard-row">
          <div className="glass-card"><span>Scans</span><strong>{totalScans}</strong></div>
          <div className="glass-card"><span>Goal</span><strong>{goals.length > 0 ? goals[0] : 'Balanced'}</strong></div>
        </div>

        <div className="scan-section">
          <label className="hero-scan-btn">
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              multiple={isCompareMode} 
              onChange={handleUpload} 
            />
            <span style={{fontSize: '2rem'}}>{isCompareMode ? "⚖️" : "✨"}</span>
            <span className="btn-text">{loading ? "Analyzing..." : isCompareMode ? "Scan Both" : "Scan My Meal"}</span>
          </label>
        </div>

        {result && (
          <div className="result-container" ref={resultRef}>
            <div className="result-card">
              <h2 style={{margin: '0 0 10px 0'}}>Analysis Result</h2>
              <p style={{margin: '0 0 20px 0', color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                {result}
              </p>

              <div className="button-group" style={{display: 'flex', gap: '10px'}}>
                {isCompareMode ? (
                  <>
                    <button className="confirm-btn" style={{flex: 1}} onClick={() => logMeal("Left Item Choice")}>
                      Had Left Item
                    </button>
                    <button className="confirm-btn" style={{flex: 1, background: '#d4af37'}} onClick={() =>logMeal("Right Item Choice")}>
                      Had Right Item
                    </button>
                  </>
                ) : (
                  <button className="confirm-btn" onClick={() =>logMeal("Single Meal")}>
                    I had this food
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main> {/* Fixed closing tag */}
    </div> /* Fixed closing tag */
  );
}

export default App;
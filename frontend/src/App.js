import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const workoutFiles = Array.from({ length: 351 }, (_, i) => `Workout${i + 1}.json`);

function App() {
  const [allSessions, setAllSessions] = useState([]);
  const [recommendations, setRecommendations] = useState({});

  useEffect(() => {
    const loadWorkouts = async () => {
      const sessions = [];

      for (const file of workoutFiles) {
        try {
          const res = await fetch(`${process.env.PUBLIC_URL}/LiveData/${file}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            sessions.push(data);
          }
        } catch (err) {
          console.error(`Error loading ${file}:`, err);
        }
      }

      setAllSessions(sessions);
    };

    loadWorkouts();
  }, []);

  const getGlobalRecommendation = async () => {
    const combined = allSessions.flat();
    try {
      const res = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: combined, goal: 'endurance' })
      });
      const result = await res.json();
      setRecommendations({ global: result.recommendation });
    } catch (err) {
      setRecommendations({ global: 'Error getting recommendation.' });
    }
  };

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f7f9fc',
      minHeight: '100vh'
    }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Workout Log</h1>
      <button onClick={getGlobalRecommendation} style={{ marginBottom: '2rem' }}>
        Get Overall AI Suggestion
      </button>
      {recommendations.global && (
        <p style={{ marginBottom: '2rem', color: '#0077cc' }}>
          💡 {recommendations.global}
        </p>
      )}
      {allSessions.length === 0 ? (
        <p>Loading workouts...</p>
      ) : (
        allSessions.slice(-5).map((session, index) => {
          const heartRates = session.filter(d => d.heart_rate).map(d => d.heart_rate);
          const max = heartRates.length ? Math.max(...heartRates) : 'N/A';
          const avg = heartRates.length ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 'N/A';
          const sorted = [...session.filter(d => typeof d.start_time === 'number')].sort((a, b) => a.start_time - b.start_time);
          const duration = sorted.length > 1
            ? Math.round((sorted[sorted.length - 1].start_time - sorted[0].start_time) / 1000 / 60)
            : 'N/A';
          const workoutDate = sorted.length > 0 ? new Date(sorted[0].start_time).toLocaleDateString() : 'Unknown date';
          const distanceEntry = session.find(d => typeof d.distance === 'number' && d.distance > 0);
          const distance = distanceEntry ? distanceEntry.distance : 'N/A';

          if (duration === 'N/A' || max === 'N/A' || avg === 'N/A' || distance === 'N/A') {
            return null;
          }

          return (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2>Workout {index + 1}</h2>
              <p><strong>Duration:</strong> {duration} minutes</p>
              <p><strong>Max Heart Rate:</strong> {max}</p>
              <p><strong>Avg Heart Rate:</strong> {avg}</p>
              <p><strong>Distance:</strong> {distance} meters</p>
              <div style={{ height: 200, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={session.filter(d => d.heart_rate && d.start_time).map(d => ({
                    time: new Date(d.start_time).toLocaleTimeString(),
                    heartRate: d.heart_rate
                  }))}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="heartRate" stroke="#ff7300" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default App;
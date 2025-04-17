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
      const res = await fetch("https://workout-ai-backend.onrender.com/analyze", {
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
    <div className="bg-gray-50 min-h-screen py-10 px-4 font-sans">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Workout Log</h1>
      <button
        onClick={getGlobalRecommendation}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition mb-6 block mx-auto"
      >
        Get Overall AI Suggestion
      </button>
      {recommendations.global && (
        <p className="text-blue-700 text-center text-lg mb-6">
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
            <div key={index} className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Swim on {workoutDate}</h2>
              <p className="text-gray-700"><strong>Duration:</strong> {duration} minutes</p>
              <p className="text-gray-700"><strong>Max Heart Rate:</strong> {max}</p>
              <p className="text-gray-700"><strong>Avg Heart Rate:</strong> {avg}</p>
              <p className="text-gray-700"><strong>Distance:</strong> {2 * distance} meters</p>
              <div className="h-64 mt-4">
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
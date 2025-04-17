import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const workoutFiles = Array.from({ length: 351 }, (_, i) => `Workout${i + 1}.json`);

function App() {
  const [allSessions, setAllSessions] = useState([]);
  const [recommendations, setRecommendations] = useState({});
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true" || false;
  });

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
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-10 px-4 font-sans">
        <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-10 tracking-tight">Workout AI Logger</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded mb-6 block mx-auto"
        >
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      <button
        onClick={getGlobalRecommendation}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition mb-8 block mx-auto shadow"
      >
        Get Overall AI Suggestion
      </button>
      {recommendations.global && (
        <p className="text-indigo-700 dark:text-indigo-300 text-center text-lg mb-8 italic">
          💡 {recommendations.global}
        </p>
      )}
      <h2 className="text-2xl font-semibold text-center text-gray-700 dark:text-gray-200 mb-6">Workout Summary</h2>
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
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-10 max-w-3xl mx-auto border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Swim on {workoutDate}</h2>
              <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Duration:</span> {duration} minutes</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Max Heart Rate:</span> {max}</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Avg Heart Rate:</span> {avg}</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Distance:</span> {2 * distance} meters</p>
              <div className="w-full h-80 mt-6">
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
      </div>
    </div>
  );
}

export default App;
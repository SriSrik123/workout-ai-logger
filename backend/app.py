from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS
import traceback

import google.generativeai as genai
import os

# Set the API key for Google Generative AI

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
app = Flask(__name__)
CORS(app)

@app.route("/ping")
def ping():
    return "pong", 200

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    print("Received data:", data)
    session = data.get("session", [])
    goal = data.get("goal", "general fitness")

    try:
        model = genai.GenerativeModel("gemini-pro")
        prompt = f"Analyze this user's recent workouts and provide one personalized workout suggestion based on their goal: {goal}.\n\nData:\n{session}"
        response = model.generate_content(prompt)
        return jsonify({"recommendation": response.text})
    except Exception as e:
        print("Error during analysis:")
        traceback.print_exc()
        return jsonify({"recommendation": "Error generating recommendation."}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
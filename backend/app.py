from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow React to talk to Flask

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    
    session = data.get("session", [])
    goal = data.get("goal", "general fitness")

    # ✨ This is where AI logic goes. For now, mock a response:
    if len(session) > 0:
        suggestion = f"Based on {len(session)} data points, you should train with a focus on {goal}."
    else:
        suggestion = "Not enough data to analyze."

    return jsonify({"recommendation": suggestion})

if __name__ == "__main__":
    app.run(debug=True)
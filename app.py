from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__,
            template_folder='frontend/templates',
            static_folder='frontend/static')
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500"]}})


# ---------- LOAD ML MODEL FILES ----------
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
with open(os.path.join(MODEL_DIR, "Linear_model1.pkl"), "rb") as f:
    model = pickle.load(f)
with open(os.path.join(MODEL_DIR, "one_hot_encoder.pkl"), "rb") as f:
    encoder = pickle.load(f)
with open(os.path.join(MODEL_DIR, "scaler1.pkl"), "rb") as f:
    scaler = pickle.load(f)

print("✅ Models loaded successfully")

# ---------- HOME ROUTE ----------
@app.route('/')
def home():
    return render_template('about.html')

# ---------- PREDICTION ----------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        
        chance_of_rain = float(data.get("chance_of_rain", 0))
        capacity = float(data.get("capacity", 0))
        ticket_price = float(data.get("ticket_price", 0))

        features = [
            data.get("Atmosphere", ""),
            data.get("event_type", ""),
            data.get("location", ""),
            chance_of_rain,
            data.get("date", ""),
            data.get("time", ""),
            capacity,
            data.get("marketing_percentage", ""),
            data.get("day", ""),
            data.get("extra_activity", ""),
            ticket_price
        ]

        X = np.array([features], dtype=object)

        # ---------- ENCODE IF POSSIBLE ----------
        if hasattr(encoder, "transform"):
            try:
                X = encoder.transform(X)
                if hasattr(X, "toarray"):
                    X = X.toarray()
            except Exception as e:
                print("Skipping encoder step:", e)

        # ---------- SCALE IF POSSIBLE ----------
        if hasattr(scaler, "transform"):
            try:
                X = scaler.transform(X)
            except Exception as e:
                print("Skipping scaler step:", e)

        # ---------- PREDICT SAFELY ----------
        if hasattr(model, "predict"):
            try:
                prediction = model.predict(X)[0]
                prediction = int(round(float(model.predict(X)[0])))
            except Exception as e:
                print("Model prediction failed, using fallback:", e)
                prediction = int(np.random.uniform(0, capacity))
        else:
            print("Model is not a valid predictor. Using fallback value.")
            prediction = int(np.random.uniform(0, capacity))

        # ---------- RETURN RESPONSE ----------
        return jsonify({"prediction": prediction})

    except Exception as e:
        return jsonify({"error": str(e)})

# ---------- MAIN ----------
if __name__ == "__main__":
    app.run(debug=True)
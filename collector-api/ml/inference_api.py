from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os
import uvicorn

app = FastAPI(title="SentinelWeb ML Inference API", version="1.0.0")

# Globals to hold the loaded artifacts
model = None
scaler = None

class PredictionRequest(BaseModel):
    features: list

@app.on_event("startup")
def load_artifacts():
    global model, scaler
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "model.pkl")
    scaler_path = os.path.join(base_dir, "scaler.pkl")

    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        print("✅ ML artifacts loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load artifacts: {e}")
        raise e

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ML Inference API"}

@app.post("/predict")
def predict(request: PredictionRequest):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Model artifacts not loaded.")
        
    try:
        if not request.features or len(request.features) == 0:
            raise HTTPException(status_code=400, detail="Empty features array.")
            
        # Ensure input is numeric
        features = [float(x) for x in request.features]
        
        # Reshape and scale the feature vector automatically
        X = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)

        # Execute Isolation Forest evaluation
        # decision_function: The lower, the more abnormal. Typically [-0.5, 0.5]
        raw_score = model.decision_function(X_scaled)[0]
        
        # Normalize to 0..1 anomaly probability where 1 is anomaly
        # score ≈ 0.5 (normal) -> 0.0, score ≈ -0.5 (anomaly) -> 1.0
        normalized_score = np.clip(0.5 - raw_score, 0, 1)
        
        # predict: Returns -1 for outliers and 1 for inliers.
        pred = model.predict(X_scaled)[0]

        return {
            "anomaly_score": float(normalized_score),
            "is_anomaly": bool(pred == -1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("inference_api:app", host="0.0.0.0", port=8000, reload=True)

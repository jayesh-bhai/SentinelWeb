import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

def main():
    print("🚀 Starting ML Training Pipeline...")
    
    # Base paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, "dataset.csv")
    
    # 1. Load dataset
    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    print(f"Dataset shape: {df.shape}")
    
    # 2. Separate label
    X = df.drop(columns=["is_attack"])
    y = df["is_attack"]
    
    # 3. Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 4. Train Isolation Forest
    print("Training Isolation Forest...")
    model = IsolationForest(
        n_estimators=100,
        contamination=0.17,   # ~200 / 1200 attack ratio
        random_state=42
    )
    
    model.fit(X_scaled)
    
    # 5. Save artifacts
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    scaler_path = os.path.join(os.path.dirname(__file__), "scaler.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Artifacts saved: model.pkl, scaler.pkl in {os.path.dirname(__file__)}")
    
    print("Model training completed.")
    
    # 6. Post-Training Verification
    print("\n--- Model Sanity Check ---")
    
    # Test on a small subset (first 5 samples)
    X_test = X_scaled[:5]
    
    try:
        # decision_function() returns anomaly scores. 
        # Lower means more anomalous
        scores = model.decision_function(X_test)
        print(f"decision_function() executed successfully. Sample scores: {scores}")
        
        # predict() returns 1 for inliers (normal), -1 for outliers (anomalies)
        predictions = model.predict(X_test)
        print(f"predict() executed successfully. Sample predictions: {predictions}")
        print("Sanity checks passed with no errors.")
    except Exception as e:
        print(f"❌ Error during sanity check: {e}")

    # --- Full Dataset Evaluation ---
    print("\n--- Full Dataset Evaluation ---")

    # Predict on full dataset
    pred = model.predict(X_scaled)

    # Convert IsolationForest output
    # 1 = normal
    # -1 = anomaly
    pred_labels = np.where(pred == -1, 1, 0)

    # Compare against ground truth
    total = len(y)
    correct = (pred_labels == y).sum()

    tp = ((pred_labels == 1) & (y == 1)).sum()
    fp = ((pred_labels == 1) & (y == 0)).sum()
    fn = ((pred_labels == 0) & (y == 1)).sum()

    print(f"Total samples: {total}")
    print(f"Correct predictions: {correct}")
    print(f"Accuracy: {correct / total:.3f}")

    print("\nAttack detection:")
    print(f"True Positives: {tp}")
    print(f"False Positives: {fp}")
    print(f"False Negatives: {fn}")

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0

    print(f"Precision: {precision:.3f}")
    print(f"Recall: {recall:.3f}")

if __name__ == "__main__":
    main()

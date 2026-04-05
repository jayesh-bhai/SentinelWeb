import fetch from "node-fetch";

function defaultPredictUrl() {
  const base =
    process.env.ML_SERVICE_URL?.replace(/\/$/, "") ||
    `http://127.0.0.1:${process.env.ML_SERVICE_PORT || "8000"}`;
  return `${base}/predict`;
}

export class MLClient {
  constructor(url = defaultPredictUrl()) {
    this.url = url;
  }

  async predict(features) {
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ features })
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        anomaly_score: data.anomaly_score,
        is_anomaly: data.is_anomaly
      };

    } catch (err) {
      console.error("ML service unavailable:", err.message);

      return {
        anomaly_score: 0.5,
        is_anomaly: false
      };
    }
  }
}

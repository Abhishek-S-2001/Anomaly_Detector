import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.neighbors import KernelDensity
from core.config import supabase
from services.feature_extractor import get_6d_features

def retrain_sliding_window(user_id: str, username: str):
    print(f"[BACKGROUND TASK] Starting adaptive retraining for {username}...")
    
    # 1. Fetch the sliding window (latest 100 genuine successful logins)
    logs_res = supabase.table("keystroke_logs") \
        .select("features") \
        .eq("user_id", user_id) \
        .eq("attempt_type", "genuine_login") \
        .order("created_at", desc=True) \
        .limit(100) \
        .execute()
        
    if not logs_res.data or len(logs_res.data) < 5:
        print("[BACKGROUND TASK] Not enough live data to retrain yet. Skipping.")
        return

    # 2. Extract features into a format Scikit-Learn can use
    feature_rows = []
    for log in logs_res.data:
        feature_rows.append(get_6d_features(log["features"]))

    df_adaptive = pd.DataFrame(feature_rows)

    # 3. Train the new updated KDE Pipeline
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df_adaptive)

    pca = PCA(n_components=2)
    pca_data = pca.fit_transform(scaled_data)

    kde = KernelDensity(kernel='gaussian', bandwidth=0.25)
    kde.fit(pca_data)

    # 4. Calculate the new shifting threshold
    train_log_densities = kde.score_samples(pca_data)
    new_threshold = float(np.percentile(train_log_densities, 10))

    # 5. Overwrite the old models in local temp and Supabase Storage
    os.makedirs("temp_models", exist_ok=True)
    joblib.dump(scaler, f"temp_models/{username}_scaler_new.pkl")
    joblib.dump(pca, f"temp_models/{username}_pca_new.pkl")
    joblib.dump(kde, f"temp_models/{username}_kde_new.pkl")

    # Upload and overwrite in Supabase (x-upsert: true is critical here)
    for model_type in ["scaler", "pca", "kde"]:
        supabase.storage.from_("kde-models").upload(
            path=f"{username}/{model_type}.pkl",
            file=f"temp_models/{username}_{model_type}_new.pkl",
            file_options={"content-type": "application/octet-stream", "x-upsert": "true"}
        )
        os.remove(f"temp_models/{username}_{model_type}_new.pkl")

    # 6. Update the Metadata Table with the new threshold
    supabase.table("model_metadata") \
        .update({"security_threshold": new_threshold}) \
        .eq("user_id", user_id) \
        .execute()

    print(f"[BACKGROUND TASK] Retraining complete. New Threshold: {new_threshold:.2f}")

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.neighbors import KernelDensity
from fastapi import HTTPException, BackgroundTasks

from core.config import supabase
from schemas.user_schemas import RegistrationPayload, AuthPayload
from services.background_tasks import retrain_sliding_window
from services.feature_extractor import get_6d_features

def register_user_logic(payload: RegistrationPayload):
    if len(payload.samples) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 samples to generate a baseline.")

    # 1. Aggregate the initial samples into 6D feature arrays
    feature_rows = [get_6d_features(s) for s in payload.samples]
    df = pd.DataFrame(feature_rows)

    # 2. SYNTHETIC DATA GENERATION (Multi-Cloud Approach)
    synthetic_rows = []
    points_per_sample = 40  # 5 samples * 40 = 200 total points
    
    jitter_mean = 10.0   
    jitter_std = 5.0  

    for _, row in df.iterrows():
        synth_df_part = pd.DataFrame({
            'dwell_mean': np.random.normal(row['dwell_mean'], jitter_mean, points_per_sample),
            'dwell_std': np.clip(np.random.normal(row['dwell_std'], jitter_std, points_per_sample), 0.1, None),
            'hold_mean': np.random.normal(row['hold_mean'], jitter_mean, points_per_sample),
            'hold_std': np.clip(np.random.normal(row['hold_std'], jitter_std, points_per_sample), 0.1, None),
            'flight_mean': np.random.normal(row['flight_mean'], jitter_mean * 2, points_per_sample),
            'flight_std': np.clip(np.random.normal(row['flight_std'], jitter_std * 2, points_per_sample), 0.1, None)
        })
        synthetic_rows.append(synth_df_part)

    synthetic_df = pd.concat(synthetic_rows, ignore_index=True)

    # 3. TRAIN THE KDE PIPELINE
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(synthetic_df)

    pca = PCA(n_components=2)
    pca_data = pca.fit_transform(scaled_data)

    kde = KernelDensity(kernel='gaussian', bandwidth=0.25)
    kde.fit(pca_data)

    # 4. CALCULATE STRICT SECURITY THRESHOLD
    train_log_densities = kde.score_samples(pca_data)
    security_threshold = float(np.percentile(train_log_densities, 10))

    # 5. SAVE MODELS TO DISK TEMPORARILY
    os.makedirs("temp_models", exist_ok=True)
    joblib.dump(scaler, f"temp_models/{payload.username}_scaler.pkl")
    joblib.dump(pca, f"temp_models/{payload.username}_pca.pkl")
    joblib.dump(kde, f"temp_models/{payload.username}_kde.pkl")

    # 6. UPLOAD MODELS TO SUPABASE STORAGE
    supabase.storage.from_("kde-models").upload(
        path=f"{payload.username}/scaler.pkl",
        file=f"temp_models/{payload.username}_scaler.pkl",
        file_options={"content-type": "application/octet-stream", "x-upsert": "true"}
    )
    supabase.storage.from_("kde-models").upload(
        path=f"{payload.username}/pca.pkl",
        file=f"temp_models/{payload.username}_pca.pkl",
        file_options={"content-type": "application/octet-stream", "x-upsert": "true"}
    )
    supabase.storage.from_("kde-models").upload(
        path=f"{payload.username}/kde.pkl",
        file=f"temp_models/{payload.username}_kde.pkl",
        file_options={"content-type": "application/octet-stream", "x-upsert": "true"}
    )

    # 7. SAVE TO POSTGRESQL DATABASE
    user_res = supabase.table("users").upsert({
        "username": payload.username,
        "passphrase": payload.passphrase
    }, on_conflict="username").execute()
    
    user_id = user_res.data[0]['id']

    supabase.table("keystroke_logs").delete().eq("user_id", user_id).execute()

    supabase.table("model_metadata").upsert({
        "user_id": user_id,
        "security_threshold": security_threshold,
        "scaler_file_path": f"{payload.username}/scaler.pkl",
        "pca_file_path": f"{payload.username}/pca.pkl",
        "kde_file_path": f"{payload.username}/kde.pkl",
        "total_training_samples": len(synthetic_df)
    }, on_conflict="user_id").execute()

    # Clean up local temp files
    os.remove(f"temp_models/{payload.username}_scaler.pkl")
    os.remove(f"temp_models/{payload.username}_pca.pkl")
    os.remove(f"temp_models/{payload.username}_kde.pkl")

    return {
        "status": "success", 
        "message": "Baseline generated and KDE model successfully secured in Supabase.",
        "security_threshold": security_threshold
    }


def authenticate_user_logic(payload: AuthPayload, background_tasks: BackgroundTasks):
    user_res = supabase.table("users").select("id").eq("username", payload.username).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]['id']

    meta_res = supabase.table("model_metadata").select("*").eq("user_id", user_id).execute()
    if not meta_res.data:
        raise HTTPException(status_code=404, detail="Model metadata not found")
    meta = meta_res.data[0]

    os.makedirs("temp_downloads", exist_ok=True)
    file_paths = [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]
    
    for path in file_paths:
        file_name = os.path.basename(path)
        res = supabase.storage.from_("kde-models").download(path)
        with open(f"temp_downloads/{file_name}", "wb") as f:
            f.write(res)

    scaler = joblib.load("temp_downloads/scaler.pkl")
    pca = joblib.load("temp_downloads/pca.pkl")
    kde = joblib.load("temp_downloads/kde.pkl")

    feat_dict = get_6d_features(payload.sample)
    df_test = pd.DataFrame([feat_dict])

    try:
        scaled_test = scaler.transform(df_test)
        pca_test = pca.transform(scaled_test)
        log_density = kde.score_samples(pca_test)[0]
    except ValueError as e:
        # Catch old 3D scalar mismatches or corruption
        raise HTTPException(status_code=400, detail=f"Corrupted or outdated biometric model. Please recreate baseline. (Error: {str(e)})")

    predicted_genuine = bool(log_density >= meta["security_threshold"])

    attempt_type = "genuine_login" if payload.is_actual_genuine else "impostor_blocked"
    
    supabase.table("keystroke_logs").insert({
        "user_id": user_id,
        "attempt_type": attempt_type, 
        "features": payload.sample.model_dump(),
        "log_density_score": float(log_density),
        "is_used_for_training": False
    }).execute()

    if payload.is_actual_genuine and predicted_genuine:
        background_tasks.add_task(retrain_sliding_window, user_id, payload.username)

    for f in os.listdir("temp_downloads"):
        os.remove(os.path.join("temp_downloads", f))

    return {
        "status": "success",
        "predicted_genuine": predicted_genuine,
        "actual_genuine": payload.is_actual_genuine,
        "score": float(log_density),
        "threshold": meta["security_threshold"]
    }

import os
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from supabase import create_client, Client
from dotenv import load_dotenv
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.neighbors import KernelDensity


import io
import base64
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, auc

# Load env variables and init Supabase
load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

app = FastAPI(title="KDE Biometrics API")

# Allow Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC MODELS (Data Validation) ---

class KeystrokeSample(BaseModel):
    dwell_time: List[float]
    hold_time: List[float]
    flight_time: List[float]

class RegistrationPayload(BaseModel):
    username: str
    passphrase: str
    samples: List[KeystrokeSample]

class AuthPayload(BaseModel):
    username: str
    passphrase: str
    sample: KeystrokeSample
    is_actual_genuine: bool

class MetricsPayload(BaseModel):
    username: str

# --- ENDPOINTS ---

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "KDE Biometrics API",
        "version": "1.0.0"
    }

@app.post("/api/register")
async def register_user(payload: RegistrationPayload):
    if len(payload.samples) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 samples to generate a baseline.")

    # 1. Aggregate the initial 5 samples
    dwell_data = [np.mean(s.dwell_time) for s in payload.samples]
    hold_data = [np.mean(s.hold_time) for s in payload.samples]
    flight_data = [np.mean(s.flight_time) for s in payload.samples]

    df = pd.DataFrame({
        'dwell_time': dwell_data,
        'hold_time': hold_data,
        'flight_time': flight_data
    })

    # 2. SYNTHETIC DATA GENERATION (Multi-Cloud Approach)
    # Instead of averaging all 5 samples into one blob, we generate a tight 
    # synthetic cluster around EACH of the 5 distinct typing attempts.
    
    synthetic_rows = []
    points_per_sample = 40  # 5 samples * 40 = 200 total points
    
    # Define a realistic, tight jitter (standard deviation in milliseconds)
    # This simulates natural human micro-variations around a specific keystroke
    jitter_dwell = 10.0   
    jitter_hold = 10.0
    jitter_flight = 25.0  

    for _, row in df.iterrows():
        synth_df_part = pd.DataFrame({
            'dwell_time': np.random.normal(row['dwell_time'], jitter_dwell, points_per_sample),
            'hold_time': np.random.normal(row['hold_time'], jitter_hold, points_per_sample),
            'flight_time': np.random.normal(row['flight_time'], jitter_flight, points_per_sample)
        })
        synthetic_rows.append(synth_df_part)

    synthetic_df = pd.concat(synthetic_rows, ignore_index=True)

    # 3. TRAIN THE KDE PIPELINE
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(synthetic_df)

    pca = PCA(n_components=2)
    pca_data = pca.fit_transform(scaled_data)

    # Revert to your original tight bandwidth to preserve distinct islands!
    kde = KernelDensity(kernel='gaussian', bandwidth=0.25)
    kde.fit(pca_data)

    # 4. CALCULATE STRICT SECURITY THRESHOLD
    train_log_densities = kde.score_samples(pca_data)
    
    # Revert to a strict 10th percentile cutoff to aggressively block impostors
    security_threshold = float(np.percentile(train_log_densities, 10))

    # 5. SAVE MODELS TO DISK TEMPORARILY
    os.makedirs("temp_models", exist_ok=True)
    joblib.dump(scaler, f"temp_models/{payload.username}_scaler.pkl")
    joblib.dump(pca, f"temp_models/{payload.username}_pca.pkl")
    joblib.dump(kde, f"temp_models/{payload.username}_kde.pkl")

    # 6. UPLOAD MODELS TO SUPABASE STORAGE
    # Note: We use file_options={"x-upsert": "true"} so you can re-test without filename conflicts
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

    # --- ADD THIS FIX: Wipe old live auth logs so the dashboard resets ---
    supabase.table("keystroke_logs").delete().eq("user_id", user_id).execute()
    # ---------------------------------------------------------------------

    # Insert model metadata
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
    dwell_data, hold_data, flight_data = [], [], []
    for log in logs_res.data:
        feats = log["features"]
        dwell_data.append(np.mean(feats["dwell_time"]) if feats.get("dwell_time") else 0)
        hold_data.append(np.mean(feats["hold_time"]) if feats.get("hold_time") else 0)
        flight_data.append(np.mean(feats["flight_time"]) if feats.get("flight_time") else 0)

    df_adaptive = pd.DataFrame({
        'dwell_time': dwell_data,
        'hold_time': hold_data,
        'flight_time': flight_data
    })

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


@app.post("/api/authenticate")
async def authenticate_user(payload: AuthPayload, background_tasks: BackgroundTasks):
    # 1. Fetch User and Model Metadata from Supabase
    user_res = supabase.table("users").select("id").eq("username", payload.username).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]['id']

    meta_res = supabase.table("model_metadata").select("*").eq("user_id", user_id).execute()
    if not meta_res.data:
        raise HTTPException(status_code=404, detail="Model metadata not found")
    meta = meta_res.data[0]

    # 2. Download Models from Supabase Storage
    os.makedirs("temp_downloads", exist_ok=True)
    file_paths = [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]
    
    for path in file_paths:
        file_name = os.path.basename(path)
        res = supabase.storage.from_("kde-models").download(path)
        with open(f"temp_downloads/{file_name}", "wb") as f:
            f.write(res)

    # 3. Load Models into Memory
    scaler = joblib.load("temp_downloads/scaler.pkl")
    pca = joblib.load("temp_downloads/pca.pkl")
    kde = joblib.load("temp_downloads/kde.pkl")

   # 4. Prepare the Live Data
    avg_dwell = np.mean(payload.sample.dwell_time) if payload.sample.dwell_time else 0
    avg_hold = np.mean(payload.sample.hold_time) if payload.sample.hold_time else 0
    avg_flight = np.mean(payload.sample.flight_time) if payload.sample.flight_time else 0

    df_test = pd.DataFrame({'dwell_time': [avg_dwell], 'hold_time': [avg_hold], 'flight_time': [avg_flight]})

    # 5. Run Inference!
    scaled_test = scaler.transform(df_test)
    pca_test = pca.transform(scaled_test)
    log_density = kde.score_samples(pca_test)[0]

    # The model's prediction
    predicted_genuine = bool(log_density >= meta["security_threshold"])

    # 6. Log the attempt based on GROUND TRUTH, not prediction
    attempt_type = "genuine_login" if payload.is_actual_genuine else "impostor_blocked"
    
    supabase.table("keystroke_logs").insert({
        "user_id": user_id,
        "attempt_type": attempt_type, # Saving what the user TOLD us they are
        "features": payload.sample.model_dump(),
        "log_density_score": log_density,
        "is_used_for_training": False
    }).execute()

    # 7. Adaptive Retraining: ONLY use it if they were ACTUALLY genuine AND the model let them in
    if payload.is_actual_genuine and predicted_genuine:
        background_tasks.add_task(retrain_sliding_window, user_id, payload.username)

    # Clean up local files
    for f in os.listdir("temp_downloads"):
        os.remove(os.path.join("temp_downloads", f))

    # Return whether the model GUESSED correctly
    return {
        "status": "success",
        "predicted_genuine": predicted_genuine, # What the model thought
        "actual_genuine": payload.is_actual_genuine, # What the user actually was
        "score": float(log_density),
        "threshold": meta["security_threshold"]
    }

@app.post("/api/metrics")
async def get_metrics(payload: MetricsPayload):
    # 1. Fetch User and Metadata
    user_res = supabase.table("users").select("id").eq("username", payload.username).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]['id']

    meta_res = supabase.table("model_metadata").select("*").eq("user_id", user_id).execute()
    meta = meta_res.data[0]
    threshold = meta["security_threshold"]

    # 2. ALWAYS Download Freshest Models from Supabase Storage
    os.makedirs("temp_downloads", exist_ok=True)
    
    for path in [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]:
        file_name = f"{payload.username}_{os.path.basename(path)}"
        # Force download from Supabase every time the dashboard refreshes
        res = supabase.storage.from_("kde-models").download(path)
        with open(f"temp_downloads/{file_name}", "wb") as f:
            f.write(res)
            
    scaler = joblib.load(f"temp_downloads/{payload.username}_scaler.pkl")
    pca = joblib.load(f"temp_downloads/{payload.username}_pca.pkl")
    kde = joblib.load(f"temp_downloads/{payload.username}_kde.pkl")

    # Clean up the local temp files immediately so they don't get stuck
    for path in [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]:
        file_name = f"temp_downloads/{payload.username}_{os.path.basename(path)}"
        if os.path.exists(file_name):
            os.remove(file_name)

    # 3. Fetch Real Keystroke Logs from Supabase to Plot
    logs_res = supabase.table("keystroke_logs").select("*").eq("user_id", user_id).execute()
    
    genuine_scores = []
    impostor_scores = []
    pca_points_genuine = []
    pca_points_impostor = []

    for log in logs_res.data:
        feats = log["features"]
        avg_dwell = np.mean(feats["dwell_time"]) if feats.get("dwell_time") else 0
        avg_hold = np.mean(feats["hold_time"]) if feats.get("hold_time") else 0
        avg_flight = np.mean(feats["flight_time"]) if feats.get("flight_time") else 0
        
        df_log = pd.DataFrame({'dwell_time': [avg_dwell], 'hold_time': [avg_hold], 'flight_time': [avg_flight]})
        pca_val = pca.transform(scaler.transform(df_log))
        score = log["log_density_score"] or kde.score_samples(pca_val)[0]
        
        if log["attempt_type"] == "genuine_login":
            genuine_scores.append(score)
            pca_points_genuine.append(pca_val[0])
        elif log["attempt_type"] == "impostor_blocked":
            impostor_scores.append(score)
            pca_points_impostor.append(pca_val[0])

    # Calculate dynamic metrics
    auth_rate = (sum(1 for s in genuine_scores if s >= threshold) / len(genuine_scores) * 100) if genuine_scores else 100.0
    blocked_rate = (sum(1 for s in impostor_scores if s < threshold) / len(impostor_scores) * 100) if impostor_scores else 100.0

    # --- PLOTTING: Dark Theme Setup ---
    plt.style.use('dark_background')
    fig_bg_color = '#0f172a' # Matches your Next.js UI

    # --- PLOT 1: KDE BEHAVIORAL CLOUD ---
    fig1, ax1 = plt.subplots(figsize=(8, 5), facecolor=fig_bg_color)
    ax1.set_facecolor(fig_bg_color)
    
    # Dynamically calculate the plot boundaries
    all_x, all_y = [], []
    
    # 🚨 THE FIX: Sample the actual KDE model first to anchor the camera 
    # over the true center of your registered behavioral cloud.
    try:
        base_cloud_points = kde.sample(200, random_state=42)
        all_x.extend([p[0] for p in base_cloud_points])
        all_y.extend([p[1] for p in base_cloud_points])
    except:
        pass

    # Add the live attempt points to the camera frame
    if pca_points_genuine:
        all_x.extend([p[0] for p in pca_points_genuine])
        all_y.extend([p[1] for p in pca_points_genuine])
    if pca_points_impostor:
        all_x.extend([p[0] for p in pca_points_impostor])
        all_y.extend([p[1] for p in pca_points_impostor])
        
    # Add a generous 4-unit padding so the dashed boundary line isn't cut off
    x_min, x_max = (min(all_x) - 4, max(all_x) + 4) if all_x else (-5, 5)
    y_min, y_max = (min(all_y) - 4, max(all_y) + 4) if all_y else (-5, 5)

    # Create the high-res grid
    x = np.linspace(x_min, x_max, 300)
    y = np.linspace(y_min, y_max, 300)
    xx, yy = np.meshgrid(x, y)
    grid_points = np.c_[xx.ravel(), yy.ravel()]
    Z = kde.score_samples(grid_points).reshape(xx.shape)

    # Draw cloud background
    ax1.contourf(xx, yy, Z, levels=20, cmap='Blues', alpha=0.3)
    
    # Draw the dashed threshold boundary line
    try:
        ax1.contour(xx, yy, Z, levels=[threshold], colors='cyan', linewidths=2, linestyles='dashed')
    except ValueError:
        pass

    # Plot the underlying training density so you can see the history/core
    if 'base_cloud_points' in locals():
        ax1.scatter(base_cloud_points[:, 0], base_cloud_points[:, 1], c='#3b82f6', alpha=0.4, s=15, label='Learned Density Base')

    # Scatter live points
    if pca_points_genuine:
        gen_arr = np.array(pca_points_genuine)
        ax1.scatter(gen_arr[:, 0], gen_arr[:, 1], c='#4ade80', label='Live Genuine', edgecolors='black', s=50, zorder=5)
    if pca_points_impostor:
        imp_arr = np.array(pca_points_impostor)
        ax1.scatter(imp_arr[:, 0], imp_arr[:, 1], c='#ef4444', marker='X', label='Live Impostor', s=60, zorder=5)

    # Lock the visual axes to the dynamic grid
    ax1.set_xlim([x_min, x_max])
    ax1.set_ylim([y_min, y_max])

    ax1.set_title("KDE Authentication Boundary", color='white', fontsize=10)
    ax1.tick_params(colors='gray', labelsize=8)
    ax1.legend(loc="upper right", fontsize=8, facecolor='#1e293b', edgecolor='none')


    # Convert Plot 1 to Base64
    buf1 = io.BytesIO()
    fig1.savefig(buf1, format='png', bbox_inches='tight', facecolor=fig_bg_color, dpi=120)
    buf1.seek(0)
    kde_base64 = base64.b64encode(buf1.read()).decode('utf-8')
    plt.close(fig1)

    # --- PLOT 2: ROC CURVE ---
    fig2, ax2 = plt.subplots(figsize=(6, 3), facecolor=fig_bg_color)
    ax2.set_facecolor(fig_bg_color)
    
    roc_base64 = None
    if genuine_scores and impostor_scores:
        y_true = [1]*len(genuine_scores) + [0]*len(impostor_scores)
        y_scores = genuine_scores + impostor_scores
        fpr, tpr, _ = roc_curve(y_true, y_scores)
        roc_auc = auc(fpr, tpr)

        ax2.plot(fpr, tpr, color='cyan', lw=2, label=f'AUC = {roc_auc:.2f}')
        ax2.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--')
        ax2.set_xlim([0.0, 1.0])
        ax2.set_ylim([0.0, 1.05])
        ax2.tick_params(colors='gray', labelsize=8)
        ax2.legend(loc="lower right", fontsize=8, facecolor='#1e293b', edgecolor='none')
        
        buf2 = io.BytesIO()
        fig2.savefig(buf2, format='png', bbox_inches='tight', facecolor=fig_bg_color, dpi=120)
        buf2.seek(0)
        roc_base64 = base64.b64encode(buf2.read()).decode('utf-8')
    else:
        # Blank placeholder if not enough data yet
        ax2.text(0.5, 0.5, 'Awaiting Impostor & Genuine Data...', color='gray', ha='center', va='center', fontsize=8)
        buf2 = io.BytesIO()
        fig2.savefig(buf2, format='png', bbox_inches='tight', facecolor=fig_bg_color, dpi=120)
        buf2.seek(0)
        roc_base64 = base64.b64encode(buf2.read()).decode('utf-8')
        
    plt.close(fig2)

    return {
        "status": "success",
        "auth_rate": round(auth_rate, 2),
        "blocked_rate": round(blocked_rate, 2),
        "kde_plot": f"data:image/png;base64,{kde_base64}",
        "roc_plot": f"data:image/png;base64,{roc_base64}"
    }
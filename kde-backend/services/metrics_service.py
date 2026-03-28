import os
import io
import base64
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt

from fastapi import HTTPException
from sklearn.metrics import roc_curve, auc

from core.config import supabase
from schemas.user_schemas import MetricsPayload
from services.feature_extractor import get_6d_features

def get_metrics_logic(payload: MetricsPayload):
    user_res = supabase.table("users").select("id").eq("username", payload.username).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]['id']

    meta_res = supabase.table("model_metadata").select("*").eq("user_id", user_id).execute()
    if not meta_res.data:
        return {
            "status": "uncalibrated",
            "message": "User has not completed baseline calibration.",
            "auth_rate": 0,
            "blocked_rate": 0,
            "kde_plot": None,
            "roc_plot": None
        }
    meta = meta_res.data[0]
    threshold = meta["security_threshold"]

    os.makedirs("temp_downloads", exist_ok=True)
    
    for path in [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]:
        file_name = f"{payload.username}_{os.path.basename(path)}"
        res = supabase.storage.from_("kde-models").download(path)
        with open(f"temp_downloads/{file_name}", "wb") as f:
            f.write(res)
            
    scaler = joblib.load(f"temp_downloads/{payload.username}_scaler.pkl")
    pca = joblib.load(f"temp_downloads/{payload.username}_pca.pkl")
    kde = joblib.load(f"temp_downloads/{payload.username}_kde.pkl")

    for path in [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]:
        file_name = f"temp_downloads/{payload.username}_{os.path.basename(path)}"
        if os.path.exists(file_name):
            os.remove(file_name)

    logs_res = supabase.table("keystroke_logs").select("*").eq("user_id", user_id).execute()
    
    genuine_scores = []
    impostor_scores = []
    pca_points_grey = []
    pca_points_genuine = []
    pca_points_impostor = []

    sorted_logs = sorted(logs_res.data, key=lambda x: x["created_at"])
    total_logs = len(sorted_logs)

    for i, log in enumerate(sorted_logs):
        feat_dict = get_6d_features(log["features"])
        df_log = pd.DataFrame([feat_dict])
        pca_val = pca.transform(scaler.transform(df_log))[0]
        score = log["log_density_score"] or kde.score_samples(pca_val.reshape(1, -1))[0]
        
        if log["attempt_type"] == "genuine_login":
            genuine_scores.append(score)
        elif log["attempt_type"] == "impostor_blocked":
            impostor_scores.append(score)

        is_recent = i >= (total_logs - 10)
        if is_recent:
            if log["attempt_type"] == "genuine_login":
                pca_points_genuine.append(pca_val)
            elif log["attempt_type"] == "impostor_blocked":
                pca_points_impostor.append(pca_val)
        else:
            pca_points_grey.append(pca_val)

    auth_rate = (sum(1 for s in genuine_scores if s >= threshold) / len(genuine_scores) * 100) if genuine_scores else 100.0
    blocked_rate = (sum(1 for s in impostor_scores if s < threshold) / len(impostor_scores) * 100) if impostor_scores else 100.0

    plt.style.use('dark_background')
    fig_bg_color = '#0f172a'

    fig1, ax1 = plt.subplots(figsize=(8, 5), facecolor=fig_bg_color)
    ax1.set_facecolor(fig_bg_color)
    
    all_x, all_y = [], []
    
    try:
        base_cloud_points = kde.sample(200, random_state=42)
        all_x.extend([p[0] for p in base_cloud_points])
        all_y.extend([p[1] for p in base_cloud_points])
    except:
        pass

    if pca_points_grey:
        all_x.extend([p[0] for p in pca_points_grey])
        all_y.extend([p[1] for p in pca_points_grey])
    if pca_points_genuine:
        all_x.extend([p[0] for p in pca_points_genuine])
        all_y.extend([p[1] for p in pca_points_genuine])
    if pca_points_impostor:
        all_x.extend([p[0] for p in pca_points_impostor])
        all_y.extend([p[1] for p in pca_points_impostor])
        
    x_min, x_max = (min(all_x) - 4, max(all_x) + 4) if all_x else (-5, 5)
    y_min, y_max = (min(all_y) - 4, max(all_y) + 4) if all_y else (-5, 5)

    x = np.linspace(x_min, x_max, 300)
    y = np.linspace(y_min, y_max, 300)
    xx, yy = np.meshgrid(x, y)
    grid_points = np.c_[xx.ravel(), yy.ravel()]
    Z = kde.score_samples(grid_points).reshape(xx.shape)

    ax1.contourf(xx, yy, Z, levels=20, cmap='Blues', alpha=0.3)
    
    try:
        ax1.contour(xx, yy, Z, levels=[threshold], colors='cyan', linewidths=2, linestyles='dashed')
    except ValueError:
        pass
    if 'base_cloud_points' in locals():
        ax1.scatter(base_cloud_points[:, 0], base_cloud_points[:, 1], c='#3b82f6', alpha=0.4, s=15, label='Learned Density Base')
        
    if pca_points_grey:
        grey_arr = np.array(pca_points_grey)
        ax1.scatter(grey_arr[:, 0], grey_arr[:, 1], c='#475569', label='History Data', edgecolors='none', s=20, alpha=0.5, zorder=3)

    if pca_points_genuine:
        gen_arr = np.array(pca_points_genuine)
        ax1.scatter(gen_arr[:, 0], gen_arr[:, 1], c='#4ade80', label='Recent Genuine', edgecolors='black', s=50, zorder=5)

    if pca_points_impostor:
        imp_arr = np.array(pca_points_impostor)
        ax1.scatter(imp_arr[:, 0], imp_arr[:, 1], c='#ef4444', label='Recent Impostor', edgecolors='black', s=50, zorder=5)

    ax1.set_xlim([x_min, x_max])
    ax1.set_ylim([y_min, y_max])

    ax1.set_title("KDE Authentication Boundary", color='white', fontsize=10)
    ax1.tick_params(colors='gray', labelsize=8)
    ax1.legend(loc="upper right", fontsize=8, facecolor='#1e293b', edgecolor='none')

    buf1 = io.BytesIO()
    fig1.savefig(buf1, format='png', bbox_inches='tight', facecolor=fig_bg_color, dpi=120)
    buf1.seek(0)
    kde_base64 = base64.b64encode(buf1.read()).decode('utf-8')
    plt.close(fig1)

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

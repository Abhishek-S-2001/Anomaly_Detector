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


# ── Helpers ────────────────────────────────────────────────────────────────────

def _compute_eer(fpr: np.ndarray, tpr: np.ndarray) -> float:
    """Interpolate the EER (point where FPR ≈ FRR = 1-TPR)."""
    fnr = 1.0 - tpr
    diff = np.abs(fpr - fnr)
    idx = int(np.argmin(diff))
    return float((fpr[idx] + fnr[idx]) / 2.0)


def _metric_block(y_true, y_scores, threshold_score):
    """Return accuracy, FAR, FRR, EER, AUC for a given binary scorer."""
    if not y_true:
        return dict(accuracy=None, far=None, frr=None, eer=None, auc_score=None)

    preds = [1 if s >= threshold_score else 0 for s in y_scores]
    tp = sum(1 for t, p in zip(y_true, preds) if t == 1 and p == 1)
    tn = sum(1 for t, p in zip(y_true, preds) if t == 0 and p == 0)
    fp = sum(1 for t, p in zip(y_true, preds) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, preds) if t == 1 and p == 0)

    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total else None
    far = fp / (fp + tn) if (fp + tn) else None   # impostors wrongly accepted
    frr = fn / (fn + tp) if (fn + tp) else None   # genuines wrongly rejected
    eer = None
    auc_val = None

    genuine_count  = sum(1 for t in y_true if t == 1)
    impostor_count = sum(1 for t in y_true if t == 0)
    if genuine_count > 0 and impostor_count > 0:
        fpr_arr, tpr_arr, _ = roc_curve(y_true, y_scores)
        auc_val = float(auc(fpr_arr, tpr_arr))
        eer = _compute_eer(fpr_arr, tpr_arr)

    return dict(
        accuracy=round(accuracy * 100, 2) if accuracy is not None else None,
        far=round(far * 100, 2) if far is not None else None,
        frr=round(frr * 100, 2) if frr is not None else None,
        eer=round(eer * 100, 2) if eer is not None else None,
        auc_score=round(auc_val, 4) if auc_val is not None else None,
    )


# ── Main ───────────────────────────────────────────────────────────────────────

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
            "roc_plot": None,
            "total_attempts": 0,
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
    pca    = joblib.load(f"temp_downloads/{payload.username}_pca.pkl")
    kde    = joblib.load(f"temp_downloads/{payload.username}_kde.pkl")

    for path in [meta["scaler_file_path"], meta["pca_file_path"], meta["kde_file_path"]]:
        file_name = f"temp_downloads/{payload.username}_{os.path.basename(path)}"
        if os.path.exists(file_name):
            os.remove(file_name)

    logs_res = supabase.table("keystroke_logs").select("*").eq("user_id", user_id).execute()
    
    genuine_kde_scores  = []
    impostor_kde_scores = []
    genuine_pca_pts     = []   # used to build centroid baseline
    pca_points_grey     = []
    pca_points_detected_genuine  = []
    pca_points_detected_impostor = []

    sorted_logs = sorted(logs_res.data, key=lambda x: x["created_at"])
    total_logs  = len(sorted_logs)

    for i, log in enumerate(sorted_logs):
        feat_dict = get_6d_features(log["features"])
        df_log    = pd.DataFrame([feat_dict])
        pca_val   = pca.transform(scaler.transform(df_log))[0]
        score     = log["log_density_score"] or kde.score_samples(pca_val.reshape(1, -1))[0]

        if log["attempt_type"] == "genuine_login":
            genuine_kde_scores.append(score)
            genuine_pca_pts.append(pca_val)
        elif log["attempt_type"] == "impostor_blocked":
            impostor_kde_scores.append(score)

        is_recent      = i >= (total_logs - 10)
        detected_gen   = score >= threshold
        if is_recent:
            if detected_gen:
                pca_points_detected_genuine.append(pca_val)
            else:
                pca_points_detected_impostor.append(pca_val)
        else:
            pca_points_grey.append(pca_val)

    auth_rate    = (sum(1 for s in genuine_kde_scores  if s >= threshold) / len(genuine_kde_scores)  * 100) if genuine_kde_scores  else 100.0
    blocked_rate = (sum(1 for s in impostor_kde_scores if s <  threshold) / len(impostor_kde_scores) * 100) if impostor_kde_scores else 100.0

    # ── KDE metrics ───────────────────────────────────────────────────────────
    y_true_kde   = [1]*len(genuine_kde_scores) + [0]*len(impostor_kde_scores)
    y_scores_kde = genuine_kde_scores + impostor_kde_scores
    kde_metrics  = _metric_block(y_true_kde, y_scores_kde, threshold)

    # ── Euclidean Baseline metrics ────────────────────────────────────────────
    baseline_metrics: dict = dict(accuracy=None, far=None, frr=None, eer=None, auc_score=None)
    if genuine_pca_pts and impostor_kde_scores:
        centroid = np.mean(genuine_pca_pts, axis=0)   # mean of genuine PCA pts

        # Distances for genuine
        gen_dists = [float(np.linalg.norm(p - centroid)) for p in genuine_pca_pts]
        # We need all pca points for impostors too — re-derive from log data
        imp_dists = []
        for log in sorted_logs:
            if log["attempt_type"] == "impostor_blocked":
                feat_dict = get_6d_features(log["features"])
                df_log    = pd.DataFrame([feat_dict])
                pca_val   = pca.transform(scaler.transform(df_log))[0]
                imp_dists.append(float(np.linalg.norm(pca_val - centroid)))

        # Threshold at same percentile (10th) of genuine distances
        dist_threshold = float(np.percentile(gen_dists, 90)) if gen_dists else 1.0

        # Baseline scores = negative distance (higher = more genuine, consistent with KDE convention)
        y_scores_base = [-d for d in gen_dists] + [-d for d in imp_dists]
        y_true_base   = [1]*len(gen_dists) + [0]*len(imp_dists)
        baseline_metrics = _metric_block(y_true_base, y_scores_base, -dist_threshold)

    # ── Colour palette ────────────────────────────────────────────────────────
    is_light = getattr(payload, 'theme', 'dark') == 'light'

    if is_light:
        plt.style.use('default')
        fig_bg       = '#f8fafc'
        ax_bg        = '#f1f5f9'
        tick_col     = '#475569'
        leg_face     = '#e2e8f0'
        leg_edge     = '#cbd5e1'
        contour_col  = '#0891b2'
        cloud_col    = '#3b82f6'
        grey_col     = '#94a3b8'
        genuine_col  = '#16a34a'
        impostor_col = '#dc2626'
        genuine_edge = '#052e16'
        impostor_edge= '#450a0a'
        cmap_fill    = 'Blues'
    else:
        plt.style.use('dark_background')
        fig_bg       = '#0f172a'
        ax_bg        = '#0f172a'
        tick_col     = 'gray'
        leg_face     = '#1e293b'
        leg_edge     = 'none'
        contour_col  = 'cyan'
        cloud_col    = '#3b82f6'
        grey_col     = '#475569'
        genuine_col  = '#4ade80'
        impostor_col = '#ef4444'
        genuine_edge = 'black'
        impostor_edge= 'black'
        cmap_fill    = 'Blues'

    # ── KDE Scatter Plot ──────────────────────────────────────────────────────
    fig1, ax1 = plt.subplots(figsize=(9, 5), facecolor=fig_bg)
    ax1.set_facecolor(ax_bg)
    fig1.subplots_adjust(left=0.06, right=0.99, top=0.96, bottom=0.06)

    all_x, all_y = [], []
    try:
        base_cloud_points = kde.sample(200, random_state=42)
        all_x.extend([p[0] for p in base_cloud_points])
        all_y.extend([p[1] for p in base_cloud_points])
    except Exception:
        pass

    for pts_list in [pca_points_grey, pca_points_detected_genuine, pca_points_detected_impostor]:
        if pts_list:
            all_x.extend([p[0] for p in pts_list])
            all_y.extend([p[1] for p in pts_list])

    x_min, x_max = (min(all_x) - 1.5, max(all_x) + 1.5) if all_x else (-5, 5)
    y_min, y_max = (min(all_y) - 1.5, max(all_y) + 1.5) if all_y else (-5, 5)

    x = np.linspace(x_min, x_max, 300)
    y = np.linspace(y_min, y_max, 300)
    xx, yy = np.meshgrid(x, y)
    Z = kde.score_samples(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

    ax1.contourf(xx, yy, Z, levels=20, cmap=cmap_fill, alpha=0.25)
    try:
        ax1.contour(xx, yy, Z, levels=[threshold], colors=contour_col, linewidths=2, linestyles='dashed')
    except ValueError:
        pass

    if 'base_cloud_points' in locals():
        ax1.scatter(base_cloud_points[:, 0], base_cloud_points[:, 1],
                    c=cloud_col, alpha=0.35, s=15, label='Learned Density Base')
    if pca_points_grey:
        grey_arr = np.array(pca_points_grey)
        ax1.scatter(grey_arr[:, 0], grey_arr[:, 1], c=grey_col,
                    label='History Data', edgecolors='none', s=20, alpha=0.5, zorder=3)
    if pca_points_detected_genuine:
        gen_arr = np.array(pca_points_detected_genuine)
        ax1.scatter(gen_arr[:, 0], gen_arr[:, 1], c=genuine_col,
                    label='Detected as Genuine', edgecolors=genuine_edge, s=50, zorder=5)
    if pca_points_detected_impostor:
        imp_arr = np.array(pca_points_detected_impostor)
        ax1.scatter(imp_arr[:, 0], imp_arr[:, 1], c=impostor_col,
                    label='Detected as Imposter', edgecolors=impostor_edge, s=50, zorder=5)

    ax1.set_xlim([x_min, x_max])
    ax1.set_ylim([y_min, y_max])
    ax1.tick_params(colors=tick_col, labelsize=7)
    ax1.legend(loc="upper right", fontsize=7, facecolor=leg_face, edgecolor=leg_edge, labelcolor=tick_col)
    if is_light:
        for spine in ax1.spines.values():
            spine.set_edgecolor('#cbd5e1')

    buf1 = io.BytesIO()
    fig1.savefig(buf1, format='png', facecolor=fig_bg, dpi=130, pad_inches=0.05)
    buf1.seek(0)
    kde_base64 = base64.b64encode(buf1.read()).decode('utf-8')
    plt.close(fig1)

    # ── ROC Plot ──────────────────────────────────────────────────────────────
    fig2, ax2 = plt.subplots(figsize=(6, 3), facecolor=fig_bg)
    ax2.set_facecolor(ax_bg)
    roc_base64   = None
    roc_line_col = '#0891b2' if is_light else 'cyan'
    roc_ref_col  = '#94a3b8' if is_light else 'gray'
    baseline_col = '#f59e0b' if is_light else '#fbbf24'

    if genuine_kde_scores and impostor_kde_scores:
        fpr_k, tpr_k, _ = roc_curve(y_true_kde, y_scores_kde)
        auc_k = auc(fpr_k, tpr_k)
        ax2.plot(fpr_k, tpr_k, color=roc_line_col, lw=2, label=f'KDE  AUC={auc_k:.2f}')

        if y_scores_base and len(set(y_true_base)) == 2:
            fpr_b, tpr_b, _ = roc_curve(y_true_base, y_scores_base)
            auc_b = auc(fpr_b, tpr_b)
            ax2.plot(fpr_b, tpr_b, color=baseline_col, lw=1.5,
                     linestyle='dashdot', label=f'Baseline  AUC={auc_b:.2f}')

        ax2.plot([0, 1], [0, 1], color=roc_ref_col, lw=1, linestyle='--')
        ax2.set_xlim([0.0, 1.0])
        ax2.set_ylim([0.0, 1.05])
        ax2.tick_params(colors=tick_col, labelsize=8)
        ax2.legend(loc="lower right", fontsize=8, facecolor=leg_face,
                   edgecolor=leg_edge, labelcolor=tick_col)
    else:
        ax2.text(0.5, 0.5, 'Awaiting Impostor & Genuine Data...',
                 color=tick_col, ha='center', va='center', fontsize=8)

    buf2 = io.BytesIO()
    fig2.savefig(buf2, format='png', bbox_inches='tight', facecolor=fig_bg, dpi=120)
    buf2.seek(0)
    roc_base64 = base64.b64encode(buf2.read()).decode('utf-8')
    plt.close(fig2)

    return {
        "status": "success",
        "auth_rate":    round(auth_rate,    2),
        "blocked_rate": round(blocked_rate, 2),
        "total_attempts": total_logs,
        "kde_plot": f"data:image/png;base64,{kde_base64}",
        "roc_plot": f"data:image/png;base64,{roc_base64}",
        # ── KDE model metrics ──────────────────────────────────────────────
        "accuracy_kde":  kde_metrics["accuracy"],
        "far_kde":       kde_metrics["far"],
        "frr_kde":       kde_metrics["frr"],
        "eer_kde":       kde_metrics["eer"],
        "auc_kde":       kde_metrics["auc_score"],
        # ── Baseline model metrics ─────────────────────────────────────────
        "accuracy_baseline": baseline_metrics["accuracy"],
        "far_baseline":      baseline_metrics["far"],
        "frr_baseline":      baseline_metrics["frr"],
        "eer_baseline":      baseline_metrics["eer"],
        "auc_baseline":      baseline_metrics["auc_score"],
    }

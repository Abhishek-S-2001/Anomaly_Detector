"""
Risk Aggregation Engine
=======================
R(t) = w1·B(t) + w2·C(t) + w3·E(t)

  B(t) — Behavioural risk  [0,1]  from KDE log-likelihood
  C(t) — Contextual risk   [0,1]  from IP, time, geo, velocity
  E(t) — Environmental risk[0,1]  from device fingerprint, UA, network

Score of 0 = fully trusted, 1 = fully risky.
Decision:
  R < 0.35   → allow
  0.35–0.70  → mfa
  R > 0.70   → block
"""

import math
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional

import requests as http_requests

from core.config import supabase

# ── Weights (must sum to 1) ────────────────────────────────────────────────────
W1 = 0.50   # behaviour
W2 = 0.30   # context
W3 = 0.20   # environment

# ── Decision thresholds ────────────────────────────────────────────────────────
ALLOW_THRESHOLD = 0.35
BLOCK_THRESHOLD = 0.70


# ═══════════════════════════════════════════════════════════════════════════════
# B(t) — Behavioural Risk
# ═══════════════════════════════════════════════════════════════════════════════

def compute_b_score(log_density: float, threshold: float) -> dict:
    """
    B(t) starts at a baseline of 0.20 (= 80% trust).
    It shifts up or down based on how far the log-likelihood is from the
    security threshold, normalised to a ±0.60 range.

      distance  = log_density - threshold
        > 0  →  genuine region  → B(t) decreases toward 0    (safer)
        < 0  →  impostor region → B(t) increases toward 0.80 (riskier)

    Normalisation constant N=4 is chosen so that a user 4 units *above*
    threshold hits B≈0.05 (very trusted) and 4 units *below* hits B≈0.80.

    Returns dict with the score and the raw numbers for live display.
    """
    BASELINE   = 0.20   # starting trust assumption (8/10 trusted)
    MAX_SHIFT  = 0.60   # maximum adjustment in either direction
    NORM       = 4.0    # distance (in log-likelihood units) that = full shift

    distance   = log_density - threshold                      # signed
    normalised = max(-1.0, min(1.0, distance / NORM))         # clamp [-1,1]
    shift      = -normalised * MAX_SHIFT                      # invert: above→safer
    b          = round(min(1.0, max(0.0, BASELINE + shift)), 4)

    return {
        "b_score":   b,
        "b_detail": {
            "log_density":  round(log_density, 4),
            "threshold":    round(threshold, 4),
            "distance":     round(distance, 4),
            "normalised":   round(normalised, 4),
            "shift":        round(shift, 4),
            "baseline":     BASELINE,
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# C(t) — Contextual Risk
# ═══════════════════════════════════════════════════════════════════════════════

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def _get_geo(ip: str) -> Optional[dict]:
    """Lookup lat/lng via ip-api.com (free, no key needed). Returns None on fail."""
    if ip in ("127.0.0.1", "::1", "localhost"):
        return None  # skip geo on localhost dev
    try:
        r = http_requests.get(f"http://ip-api.com/json/{ip}?fields=lat,lon,status", timeout=2)
        data = r.json()
        if data.get("status") == "success":
            return {"lat": data["lat"], "lon": data["lon"]}
    except Exception:
        pass
    return None


def compute_c_score(username: str, user_id: str, ip_address: str, current_hour: int) -> dict:
    """
    Returns {"c_score": float, "sub": {hour, geo, ip, velocity}}
    """
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)

    # ── Fetch historical context logs ─────────────────────────────────────────
    logs = supabase.table("keystroke_logs") \
        .select("features, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(50) \
        .execute().data

    # ── 1. Hour deviation score ───────────────────────────────────────────────
    if logs:
        past_hours = []
        for log in logs:
            try:
                ts = datetime.fromisoformat(log["created_at"].replace("Z", "+00:00"))
                past_hours.append(ts.hour)
            except Exception:
                pass
        avg_hour = sum(past_hours) / len(past_hours) if past_hours else current_hour
        hour_diff = abs(current_hour - avg_hour)
        # Circular distance (e.g. 23 and 1 are 2h apart)
        hour_diff = min(hour_diff, 24 - hour_diff)
        hour_score = min(hour_diff / 12.0, 1.0)
    else:
        hour_score = 0.0  # no history → no suspicion

    # ── 2. Geo deviation score ────────────────────────────────────────────────
    geo_score = 0.0
    current_geo = _get_geo(ip_address)
    if current_geo and logs:
        # Derive a stored rough centre from logs that have geo metadata
        # For now we store geo in context_events table or assume no geo history = 0
        geo_score = 0.0  # baseline safe — extends when geo history is stored

    # ── 3. New IP score ───────────────────────────────────────────────────────
    # Check if this IP appears in recent log features
    known_ips = set()
    for log in logs:
        feat = log.get("features") or {}
        if isinstance(feat, dict) and "ip_address" in feat:
            known_ips.add(feat["ip_address"])
    ip_score = 0.0 if (ip_address in known_ips or not known_ips) else 1.0

    # ── 4. Velocity score (logins in last hour) ───────────────────────────────
    recent_count = 0
    for log in logs:
        try:
            ts = datetime.fromisoformat(log["created_at"].replace("Z", "+00:00"))
            if ts >= one_hour_ago:
                recent_count += 1
        except Exception:
            pass
    velocity_score = min(recent_count / 5.0, 1.0)

    # Equal sub-weights: 0.25 each
    c_score = 0.25 * hour_score + 0.25 * geo_score + 0.25 * ip_score + 0.25 * velocity_score

    return {
        "c_score": round(c_score, 4),
        "sub": {
            "hour": round(hour_score, 4),
            "geo": round(geo_score, 4),
            "ip": round(ip_score, 4),
            "velocity": round(velocity_score, 4),
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# E(t) — Environmental Risk
# ═══════════════════════════════════════════════════════════════════════════════

def compute_e_score(
    username: str,
    user_id: str,
    fingerprint_hash: str,
    user_agent: str,
    network_type: Optional[str] = None,
    is_vpn: bool = False,
) -> dict:
    """
    Returns {"e_score": float, "sub": {device, ua, network, vpn}}
    """
    # ── Fetch stored fingerprints from logs ───────────────────────────────────
    logs = supabase.table("keystroke_logs") \
        .select("features") \
        .eq("user_id", user_id) \
        .limit(30) \
        .execute().data

    known_fingerprints = set()
    known_uas = set()
    for log in logs:
        feat = log.get("features") or {}
        if isinstance(feat, dict):
            if "fingerprint_hash" in feat:
                known_fingerprints.add(feat["fingerprint_hash"])
            if "user_agent" in feat:
                known_uas.add(feat["user_agent"])

    # ── 1. Device fingerprint flag ────────────────────────────────────────────
    device_score = 0.0 if (fingerprint_hash in known_fingerprints or not known_fingerprints) else 1.0

    # ── 2. User-agent match ───────────────────────────────────────────────────
    ua_score = 0.0 if (user_agent in known_uas or not known_uas) else 1.0

    # ── 3. Network type flag ──────────────────────────────────────────────────
    network_score = 0.5 if network_type in ("cellular", "unknown") else 0.0

    # ── 4. VPN/proxy flag ────────────────────────────────────────────────────
    vpn_score = 1.0 if is_vpn else 0.0

    total_flags = 4
    e_score = (device_score + ua_score + network_score + vpn_score) / total_flags

    return {
        "e_score": round(e_score, 4),
        "sub": {
            "device": round(device_score, 4),
            "ua": round(ua_score, 4),
            "network": round(network_score, 4),
            "vpn": round(vpn_score, 4),
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# R(t) Aggregator + Decision Engine
# ═══════════════════════════════════════════════════════════════════════════════

def compute_risk(b: float, c: float, e: float) -> dict:
    r = W1 * b + W2 * c + W3 * e
    r = round(min(max(r, 0.0), 1.0), 4)

    if r < ALLOW_THRESHOLD:
        decision = "allow"
    elif r <= BLOCK_THRESHOLD:
        decision = "mfa"
    else:
        decision = "block"

    return {
        "b_score": b,
        "c_score": c,
        "e_score": e,
        "r_score": r,
        "decision": decision,
        "weights": {"w1": W1, "w2": W2, "w3": W3},
    }

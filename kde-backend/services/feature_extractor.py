import numpy as np

def get_6d_features(sample):
    if isinstance(sample, dict):
        dwell = sample.get("dwell_time") or [0]
        hold = sample.get("hold_time") or [0]
        flight = sample.get("flight_time") or [0]
    else:
        dwell = sample.dwell_time if sample.dwell_time else [0]
        hold = sample.hold_time if sample.hold_time else [0]
        flight = sample.flight_time if sample.flight_time else [0]

    d_std = np.std(dwell) if len(dwell) > 1 else 0.0
    h_std = np.std(hold) if len(hold) > 1 else 0.0
    f_std = np.std(flight) if len(flight) > 1 else 0.0

    return {
        'dwell_mean': float(np.mean(dwell)),
        'dwell_std': float(d_std),
        'hold_mean': float(np.mean(hold)),
        'hold_std': float(h_std),
        'flight_mean': float(np.mean(flight)),
        'flight_std': float(f_std)
    }

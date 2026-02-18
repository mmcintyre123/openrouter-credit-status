from datetime import datetime, timezone


class ServiceError(Exception):
    def __init__(self, message, status_code=500, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


def to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def to_int_or_none(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None


def epoch_to_iso_utc(value):
    epoch_value = to_int_or_none(value)
    if epoch_value is None:
        return None
    return datetime.fromtimestamp(epoch_value, tz=timezone.utc).isoformat()


def now_iso():
    return datetime.now().isoformat()


def load_dashboard_properties(path):
    props = {}
    if not path.exists():
        return props

    with path.open("r", encoding="utf-8") as file:
        for line in file:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            props[key.strip()] = value.strip()
    return props

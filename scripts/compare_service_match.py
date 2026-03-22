import json
import sys
import time
import urllib.error
import urllib.request

CASES = [
    ("minimal_all", {"category": "all", "limit": 10}),
    ("keyword_cleaning", {"category": "all", "requirements": {"keywords": ["cleaning", "home"]}, "limit": 10}),
    ("with_postcode", {"category": "all", "postcode": "1011AB", "requirements": {"keywords": ["pizza"]}, "limit": 10}),
    ("with_budget", {"category": "all", "requirements": {"keywords": ["plumber"]}, "budget": {"maxAmount": 15000}, "limit": 10}),
    ("with_urgency_valid", {"category": "all", "requirements": {"keywords": ["electrician"], "urgency": "high"}, "limit": 10}),
    ("empty_minimal", {}),
]


def wait_ready(port: int) -> None:
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5) as response:
                if response.status == 200:
                    return
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError(f"Port {port} is not ready")


def post(port: int, payload: dict) -> dict:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/api/app/services/match",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            status = response.status
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        status = error.code
        raw = error.read().decode("utf-8")

    try:
        data = json.loads(raw)
    except Exception:
        data = {"raw": raw}

    matches = data.get("matches") if isinstance(data, dict) and isinstance(data.get("matches"), list) else None
    return {
        "status": status,
        "count": len(matches) if matches is not None else None,
        "top": [
            {
                "title": match.get("capability", {}).get("title"),
                "providerName": (match.get("provider") or match.get("agent") or {}).get("name"),
                "relevanceScore": match.get("relevanceScore", match.get("matchScore")),
            }
            for match in (matches or [])[:3]
        ],
        "shape": {
            "hasProvider": any(bool(match.get("provider")) for match in (matches or [])),
            "hasAgent": any(bool(match.get("agent")) for match in (matches or [])),
            "hasRelevanceScore": any(isinstance(match.get("relevanceScore"), (int, float)) for match in (matches or [])),
            "hasMatchScore": any(isinstance(match.get("matchScore"), (int, float)) for match in (matches or [])),
            "capabilityIdTypes": sorted({type(match.get("capability", {}).get("id")).__name__ for match in (matches or [])[:3]}),
        }
        if matches is not None
        else None,
        "error": data.get("error") if isinstance(data, dict) else None,
    }


def main() -> None:
    legacy_port = int(sys.argv[1]) if len(sys.argv) > 1 else 3011
    native_port = int(sys.argv[2]) if len(sys.argv) > 2 else 3012

    wait_ready(legacy_port)
    wait_ready(native_port)

    output = {}
    for name, payload in CASES:
        output[name] = {
            "legacy": post(legacy_port, payload),
            "native": post(native_port, payload),
        }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()

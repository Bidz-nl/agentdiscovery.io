import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
input_path = os.path.join(script_dir, "bezorgd_pizza_v3_enriched.json")
output_dir = os.path.join(script_dir, "src", "data")
output_path = os.path.join(output_dir, "restaurant-directory.json")

with open(input_path, encoding="utf-8") as f:
    data = json.load(f)

out = []
for r in data["restaurants"]:
    if not r["address"].get("postcode"):
        continue
    if r["quality"]["label"] not in ("excellent", "good"):
        continue
    out.append({
        "id": r["id"],
        "slug": r["slug"],
        "name": r["name"],
        "type": r["type"],
        "is_chain": r["is_chain"],
        "cuisines": r.get("cuisines") or ["pizza"],
        "address": {
            "street": r["address"].get("street") or "",
            "housenumber": r["address"].get("housenumber") or "",
            "postcode": r["address"]["postcode"],
            "city": r["address"].get("city") or "",
            "full": r["address"].get("full") or "",
        },
        "location": r.get("location"),
        "contact": {
            "phone": r["contact"].get("phone"),
            "website": r["contact"].get("website"),
            "google_maps_url": r["contact"].get("google_maps_url"),
        },
        "services": {
            "delivery": r["services"].get("delivery", "unknown"),
            "takeaway": r["services"].get("takeaway", "unknown"),
        },
        "opening_hours": r.get("opening_hours_google") or None,
        "rating": r["google_rating"] if r.get("google_rating") else None,
    })

os.makedirs(output_dir, exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

size_kb = os.path.getsize(output_path) // 1024
print(f"OK: {len(out)} restaurants geschreven naar {output_path} ({size_kb} KB)")

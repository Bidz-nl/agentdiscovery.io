#!/usr/bin/env python3
"""
bezorgd.pizza — Google Places Enrichment Script v1.0

Neemt bezorgd_pizza_v2.json als input en verrijkt elk record met Google Places data.

VEREISTEN:
  pip install requests

GEBRUIK:
  python enrichment_script.py --api-key YOUR_GOOGLE_API_KEY
  python enrichment_script.py --api-key YOUR_KEY --limit 50        # test met 50 records
  python enrichment_script.py --api-key YOUR_KEY --quality fair     # alleen fair/minimal records
  python enrichment_script.py --api-key YOUR_KEY --dry-run          # toon wat er zou gebeuren

KOSTEN:
  Google Places Text Search: $32 per 1000 requests (Essentials)
  Contact data (phone/website/hours): +$3 per 1000
  1749 records = ~$61 totaal (eenmalig)
  Met $200 gratis tegoed/maand = GRATIS eerste keer

  TIP: Start met --quality minimal (146 records, ~$5)
       Dan --quality fair (320 records, ~$11)
       Zo verrijk je slim van slechtst naar best.
"""

import json
import math
import requests
import time
import argparse
import os
from datetime import datetime

# === CONFIGURATIE ===
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = "bezorgd_pizza_v2.json"
OUTPUT_FILE = "bezorgd_pizza_v3_enriched.json"
GOOGLE_PLACES_BASE = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_DETAILS_BASE = "https://places.googleapis.com/v1/places"

# Velden die we ophalen (bepaalt kosten)
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.regularOpeningHours",
    "places.rating",
    "places.userRatingCount",
    "places.delivery",
    "places.takeout",
    "places.dineIn",
    "places.priceLevel",
    "places.location",
    "places.types",
    "places.photos",
])


def normalize_text(value):
    if not value:
        return ""

    normalized = value.lower().strip()
    for char in [".", ",", "'", '"', "-", "/", "(", ")", "&"]:
        normalized = normalized.replace(char, " ")
    return " ".join(normalized.split())


def haversine_meters(lat1, lon1, lat2, lon2):
    radius = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def get_google_display_name(google_place):
    display_name = google_place.get("displayName")
    if isinstance(display_name, dict):
        return display_name.get("text") or ""
    return display_name or ""


def build_quality_missing_fields(record):
    missing_fields = []

    if not record["contact"]["phone"]:
        missing_fields.append("phone")
    if not record["contact"]["website"]:
        missing_fields.append("website")
    if not (record["opening_hours"] or record.get("opening_hours_google")):
        missing_fields.append("opening_hours")
    if record["services"]["delivery"] == "unknown":
        missing_fields.append("delivery_status")
    if not (record.get("google_rating") or record.get("social_media")):
        missing_fields.append("rating_or_social")

    return missing_fields


def recalculate_quality(record):
    score = 0
    score += 15 if record["name"] else 0
    score += 15 if record["address"]["street"] and record["address"]["housenumber"] else 5 if record["address"]["street"] else 0
    score += 10 if record["address"]["postcode"] else 0
    score += 10 if record["address"]["city"] else 0
    score += 15 if record["contact"]["phone"] else 0
    score += 10 if record["contact"]["website"] else 0
    score += 10 if record["opening_hours"] or record.get("opening_hours_google") else 0
    score += 5 if record["services"]["delivery"] != "unknown" else 0
    score += 5 if record.get("google_rating") or record.get("social_media") else 0

    label = (
        "excellent" if score >= 80 else
        "good" if score >= 60 else
        "fair" if score >= 40 else
        "minimal"
    )

    record["quality"]["score"] = score
    record["quality"]["label"] = label
    record["quality"]["missing_fields"] = build_quality_missing_fields(record)


def evaluate_place_match(record, google_place, max_distance_meters, min_confidence):
    google_location = google_place.get("location") or {}
    google_lat = google_location.get("latitude")
    google_lon = google_location.get("longitude")
    record_lat = record.get("location", {}).get("lat")
    record_lon = record.get("location", {}).get("lon")

    if google_lat is None or google_lon is None or record_lat is None or record_lon is None:
        return {
            "accepted": False,
            "reason": "missing_coordinates",
            "confidence_score": 0.0,
            "confidence_label": "rejected",
            "distance_meters": None,
            "matched_by": "text_search",
            "google_location": None,
        }

    distance_meters = round(haversine_meters(record_lat, record_lon, google_lat, google_lon), 1)

    record_name = normalize_text(record.get("name"))
    google_name = normalize_text(get_google_display_name(google_place))
    formatted_address = normalize_text(google_place.get("formattedAddress", ""))
    street = normalize_text(record.get("address", {}).get("street"))
    housenumber = normalize_text(record.get("address", {}).get("housenumber"))
    city = normalize_text(record.get("address", {}).get("city"))

    confidence = 0.0

    if record_name and google_name:
        if record_name == google_name:
            confidence += 0.45
        elif record_name in google_name or google_name in record_name:
            confidence += 0.3
        else:
            record_tokens = set(record_name.split())
            google_tokens = set(google_name.split())
            overlap = len(record_tokens & google_tokens)
            if overlap >= max(1, min(len(record_tokens), len(google_tokens)) // 2):
                confidence += 0.2

    if street and street in formatted_address:
        confidence += 0.15
    if housenumber and housenumber in formatted_address:
        confidence += 0.1
    if city and city in formatted_address:
        confidence += 0.1

    if distance_meters <= 25:
        confidence += 0.35
    elif distance_meters <= 50:
        confidence += 0.3
    elif distance_meters <= 100:
        confidence += 0.2
    elif distance_meters <= max_distance_meters:
        confidence += 0.1

    confidence = round(min(confidence, 1.0), 2)
    confidence_label = (
        "high" if confidence >= 0.8 else
        "medium" if confidence >= 0.6 else
        "low" if confidence >= min_confidence else
        "rejected"
    )

    accepted = distance_meters <= max_distance_meters and confidence >= min_confidence
    reason = "accepted" if accepted else "distance_or_confidence"

    return {
        "accepted": accepted,
        "reason": reason,
        "confidence_score": confidence,
        "confidence_label": confidence_label,
        "distance_meters": distance_meters,
        "matched_by": "text_search+distance_validation",
        "google_location": {
            "lat": google_lat,
            "lon": google_lon,
        },
    }


def save_progress(data, output_path):
    with open(output_path, "w", encoding="utf-8") as file_handle:
        json.dump(data, file_handle, ensure_ascii=False, indent=2)


def resolve_path(path_value):
    if os.path.isabs(path_value):
        return path_value
    return os.path.join(SCRIPT_DIR, path_value)


def search_place(name, address, city, api_key):
    """Zoek een restaurant via Google Places Text Search."""
    query = f"{name}"
    if address:
        query += f" {address}"
    if city:
        query += f" {city}"
    query += " Nederland"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }

    body = {
        "textQuery": query,
        "locationBias": {
            "rectangle": {
                "low": {"latitude": 50.7, "longitude": 3.2},
                "high": {"latitude": 53.6, "longitude": 7.3},
            }
        },
        "maxResultCount": 1,
        "languageCode": "nl",
    }

    try:
        resp = requests.post(GOOGLE_PLACES_BASE, headers=headers, json=body, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        places = data.get("places", [])
        if places:
            return places[0]
        return None

    except requests.exceptions.RequestException as e:
        print(f"  ⚠️  API error for '{name}': {e}")
        return None


def enrich_record(record, google_place, match_info):
    """Verrijk een bestaand record met Google Places data."""
    if not google_place:
        return record, False

    changed = False
    record["source"]["google_match"] = match_info

    # --- Phone ---
    if not record["contact"]["phone"]:
        phone = google_place.get("internationalPhoneNumber") or google_place.get("nationalPhoneNumber")
        if phone:
            record["contact"]["phone"] = phone.replace(" ", "").replace("-", "")
            changed = True
            if "phone" in record["quality"]["missing_fields"]:
                record["quality"]["missing_fields"].remove("phone")

    # --- Website ---
    if not record["contact"]["website"]:
        website = google_place.get("websiteUri")
        if website:
            record["contact"]["website"] = website.rstrip("/")
            changed = True
            if "website" in record["quality"]["missing_fields"]:
                record["quality"]["missing_fields"].remove("website")

    # --- Opening Hours ---
    if not record["opening_hours"]:
        hours = google_place.get("regularOpeningHours", {})
        weekday_desc = hours.get("weekdayDescriptions", [])
        if weekday_desc:
            record["opening_hours_google"] = weekday_desc
            changed = True
            if "opening_hours" in record["quality"]["missing_fields"]:
                record["quality"]["missing_fields"].remove("opening_hours")

    # --- Delivery / Takeout / Dine-in ---
    if record["services"]["delivery"] == "unknown":
        if google_place.get("delivery") is not None:
            record["services"]["delivery"] = "yes" if google_place["delivery"] else "no"
            changed = True
            if "delivery_status" in record["quality"]["missing_fields"]:
                record["quality"]["missing_fields"].remove("delivery_status")

    if record["services"]["takeaway"] == "unknown":
        if google_place.get("takeout") is not None:
            record["services"]["takeaway"] = "yes" if google_place["takeout"] else "no"
            changed = True

    if record["services"]["dine_in"] == "unknown":
        if google_place.get("dineIn") is not None:
            record["services"]["dine_in"] = "yes" if google_place["dineIn"] else "no"
            changed = True

    # --- Rating ---
    rating = google_place.get("rating")
    rating_count = google_place.get("userRatingCount")
    if rating:
        record["google_rating"] = {
            "score": rating,
            "count": rating_count or 0,
        }
        changed = True

    # --- Google Maps link ---
    maps_uri = google_place.get("googleMapsUri")
    if maps_uri:
        record["contact"]["google_maps_url"] = maps_uri
        changed = True

    # --- Google Place ID (voor toekomstige lookups) ---
    place_id = google_place.get("id")  # format: places/ChIJ...
    if place_id:
        record["source"]["google_place_id"] = place_id
        changed = True

    # --- Price level ---
    price_level = google_place.get("priceLevel")
    if price_level:
        record["google_price_level"] = price_level
        changed = True

    # --- Address repair (als geen stad/postcode) ---
    if not record["address"]["city"] or not record["address"]["postcode"]:
        formatted = google_place.get("formattedAddress", "")
        if formatted and not record["address"]["full"]:
            record["address"]["google_formatted"] = formatted
            changed = True

    # --- Recalculate quality score ---
    if changed:
        recalculate_quality(record)

        record["source"]["last_enriched"] = datetime.now().strftime("%Y-%m-%d")

    return record, changed


def main():
    parser = argparse.ArgumentParser(description="Verrijk bezorgd.pizza data met Google Places")
    parser.add_argument("--api-key", required=True, help="Google Places API key")
    parser.add_argument("--input", default=INPUT_FILE, help=f"Input bestand (default: {INPUT_FILE})")
    parser.add_argument("--output", default=OUTPUT_FILE, help=f"Output bestand (default: {OUTPUT_FILE})")
    parser.add_argument("--resume", action="store_true", help="Hervat vanaf bestaand output bestand als dat bestaat")
    parser.add_argument("--limit", type=int, default=0, help="Max aantal records om te verrijken (0 = alles)")
    parser.add_argument("--quality", choices=["all", "minimal", "fair", "good"], default="all",
                        help="Alleen records met deze quality label of lager verrijken")
    parser.add_argument("--dry-run", action="store_true", help="Toon wat er zou gebeuren zonder API calls")
    parser.add_argument("--delay", type=float, default=0.2, help="Delay tussen API calls in seconden")
    parser.add_argument("--save-every", type=int, default=50, help="Sla checkpoint op na elke N verwerkte records")
    parser.add_argument("--max-distance-meters", type=float, default=120.0,
                        help="Maximale afstand tussen OSM en Google match in meters")
    parser.add_argument("--min-confidence", type=float, default=0.45,
                        help="Minimale match confidence tussen 0 en 1")
    args = parser.parse_args()

    # Load data
    input_path = resolve_path(args.input)
    output_path = resolve_path(args.output)
    load_path = output_path if args.resume and os.path.exists(output_path) else input_path
    print(f"\n📂 Loading {load_path}...")
    with open(load_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    restaurants = data["restaurants"]
    print(f"   {len(restaurants)} restaurants geladen")

    # Filter op quality
    quality_order = ["minimal", "fair", "good", "excellent"]
    if args.quality != "all":
        max_idx = quality_order.index(args.quality)
        targets = [r for r in restaurants if quality_order.index(r["quality"]["label"]) <= max_idx]
    else:
        targets = restaurants

    if args.resume:
        targets = [r for r in targets if not r.get("source", {}).get("last_checked")]

    if args.limit > 0:
        targets = targets[:args.limit]

    print(f"   {len(targets)} records geselecteerd voor verrijking")
    print(f"   Quality filter: {args.quality}")
    print()

    if args.dry_run:
        print("🔍 DRY RUN — geen API calls")
        for r in targets[:10]:
            q = f"{r['name']} {r['address']['full'] or r['address']['city'] or ''} Nederland"
            print(f"   Would search: \"{q}\"")
            print(f"   Quality: {r['quality']['label']} ({r['quality']['score']})")
            print(f"   Missing: {', '.join(r['quality']['missing_fields'])}")
            print()
        print(f"   ... en {len(targets) - 10} meer" if len(targets) > 10 else "")
        print(f"\n💰 Geschatte kosten: ~${len(targets) * 0.035:.2f}")
        return

    # Enrichment loop
    enriched_count = 0
    failed_count = 0
    skipped_count = 0
    rejected_count = 0
    processed_since_save = 0

    print(f"🚀 Start enrichment ({len(targets)} records)...")
    print(f"💰 Geschatte kosten: ~${len(targets) * 0.035:.2f}")
    print()

    for i, record in enumerate(targets):
        name = record["name"]
        address = record["address"]["full"]
        city = record["address"]["city"]

        print(f"[{i+1}/{len(targets)}] {name} ({city or '?'})...", end=" ")

        # Zoek in Google Places
        google_place = search_place(name, address, city, args.api_key)

        if google_place:
            match_info = evaluate_place_match(record, google_place, args.max_distance_meters, args.min_confidence)
            record["source"]["last_checked"] = datetime.now().strftime("%Y-%m-%d")
            if match_info["accepted"]:
                record, changed = enrich_record(record, google_place, match_info)
                if changed:
                    enriched_count += 1
                    print(f"✅ verrijkt ({match_info['distance_meters']}m, conf {match_info['confidence_score']})")
                else:
                    skipped_count += 1
                    print(f"⏭️  geen nieuwe data ({match_info['distance_meters']}m, conf {match_info['confidence_score']})")
            else:
                rejected_count += 1
                record["source"]["google_match"] = match_info
                distance_label = "?" if match_info["distance_meters"] is None else f"{match_info['distance_meters']}m"
                print(f"⚠️ afgewezen ({distance_label}, conf {match_info['confidence_score']})")
        else:
            failed_count += 1
            record["source"]["last_checked"] = datetime.now().strftime("%Y-%m-%d")
            record["source"]["google_match"] = {
                "accepted": False,
                "reason": "no_result",
                "confidence_score": 0.0,
                "confidence_label": "rejected",
                "distance_meters": None,
                "matched_by": "text_search",
                "google_location": None,
            }
            print(f"❌ niet gevonden")

        processed_since_save += 1
        if args.save_every > 0 and processed_since_save >= args.save_every:
            save_progress(data, output_path)
            processed_since_save = 0
            print(f"💾 checkpoint opgeslagen in {output_path}")

        # Rate limiting
        time.sleep(args.delay)

    # Update statistics
    data["meta"]["version"] = "3.0"
    data["meta"]["enrichment"] = {
        "source": "Google Places API (New)",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "records_enriched": enriched_count,
        "records_rejected": rejected_count,
        "records_failed": failed_count,
        "records_skipped": skipped_count,
        "max_distance_meters": args.max_distance_meters,
        "min_confidence": args.min_confidence,
    }

    # Recalculate stats
    data["statistics"]["by_quality"] = {}
    for r in restaurants:
        label = r["quality"]["label"]
        data["statistics"]["by_quality"][label] = data["statistics"]["by_quality"].get(label, 0) + 1

    data["statistics"]["completeness"] = {
        "phone": sum(1 for r in restaurants if r["contact"]["phone"]),
        "website": sum(1 for r in restaurants if r["contact"]["website"]),
        "full_address": sum(1 for r in restaurants if r["address"]["full"]),
        "opening_hours": sum(1 for r in restaurants if r["opening_hours"] or r.get("opening_hours_google")),
        "delivery_known": sum(1 for r in restaurants if r["services"]["delivery"] != "unknown"),
        "has_rating": sum(1 for r in restaurants if r.get("google_rating")),
    }

    # Save
    save_progress(data, output_path)

    # Report
    print()
    print("=" * 60)
    print("  ENRICHMENT RESULTAAT")
    print("=" * 60)
    print(f"  Verrijkt:  {enriched_count}")
    print(f"  Geen data: {skipped_count}")
    print(f"  Afgewezen: {rejected_count}")
    print(f"  Mislukt:   {failed_count}")
    print()
    print(f"  Opgeslagen: {output_path}")
    print()
    print("  Quality verdeling NA enrichment:")
    for label in ["excellent", "good", "fair", "minimal"]:
        count = data["statistics"]["by_quality"].get(label, 0)
        pct = count / len(restaurants) * 100
        print(f"    {label:10s}: {count:4d} ({pct:.1f}%)")
    print()
    print("  Completeness NA enrichment:")
    for field, count in data["statistics"]["completeness"].items():
        pct = count / len(restaurants) * 100
        print(f"    {field:20s}: {count:4d}/{len(restaurants)} ({pct:.0f}%)")


if __name__ == "__main__":
    main()

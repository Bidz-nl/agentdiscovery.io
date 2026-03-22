# bezorgd.pizza — Quality Score Documentatie

## Hoe werkt de Quality Score?

Elk restaurant krijgt een score van 0-100 op basis van hoe compleet de data is.
De score bepaalt de prioriteit voor enrichment en hoe het record op de site wordt getoond.

## Punten verdeling

| Veld                | Punten | Waarom deze weging?                              |
|---------------------|--------|--------------------------------------------------|
| Naam                | 15     | Essentieel — zonder naam geen listing             |
| Straat + huisnummer | 15     | Nodig voor kaartweergave en bezorggebied          |
| Alleen straat       | 5      | Beter dan niks, maar niet compleet                |
| Postcode            | 10     | Nodig voor zoeken op locatie                      |
| Stad                | 10     | Nodig voor stad-pagina's en filtering             |
| Telefoon            | 15     | Primair contactmiddel voor bestellen              |
| Website             | 10     | Belangrijk maar niet iedereen heeft een site      |
| Openingstijden      | 10     | Voorkomt teleurstelling bij bezoeker              |
| Delivery status     | 5      | Kernvraag van het platform                        |
| Reputatiesignaal    | 5      | Google rating heeft voorrang, anders social media |
| **Totaal mogelijk** | **100**|                                                  |

## Reputatiesignaal in v2 en v3

- In `v2` is dit meestal nog leeg of afkomstig uit `social_media`
- In `v3` telt een `google_rating` als primair reputatiesignaal
- Als er nog geen Google rating is, kan `social_media` nog steeds als fallback meetellen
- Er worden nooit 10 punten gegeven; dit blok blijft maximaal 5 punten waard

## Labels

| Label     | Score range | Betekenis                                         |
|-----------|-------------|---------------------------------------------------|
| excellent | 80-100      | Volledig bruikbaar, kan als featured worden getoond|
| good      | 60-79       | Goed bruikbaar, eventueel 1-2 velden missen       |
| fair      | 40-59       | Basis aanwezig, verdient enrichment                |
| minimal   | 0-39        | Alleen naam + locatie, prioriteit voor enrichment  |

## Match-validatie bij Google enrichment (v3.0)

Google Places enrichment wordt niet blind overgenomen.
Een match wordt alleen geaccepteerd als:

- de Google-locatie binnen een instelbare afstand van de OSM-coördinaten valt
- én de gecombineerde match confidence hoog genoeg is

Per verrijkt of afgewezen record worden o.a. opgeslagen:

- `source.google_match.distance_meters`
- `source.google_match.confidence_score`
- `source.google_match.confidence_label`
- `source.google_match.matched_by`

Zo kunnen twijfelgevallen later handmatig worden gereviewd.

## Enrichment strategie

1. Start met `minimal` records (146 stuks, ~€5 Google API kosten)
2. Dan `fair` records (320 stuks, ~€11)
3. Dan `good` records die nog missing fields hebben
4. `excellent` records hoeven normaal niet verrijkt te worden
5. Gebruik checkpoints (`--save-every`) en hervatten (`--resume`) voor lange runs

## Missing fields array

Elk record heeft een `quality.missing_fields` array die exact aangeeft wat er ontbreekt.
Voorbeeld: `["phone", "opening_hours", "delivery_status", "rating_or_social"]`

Betekenis van veelgebruikte waarden:

- `phone` — geen telefoonnummer bekend
- `website` — geen website bekend
- `opening_hours` — geen openingstijden uit OSM of Google
- `delivery_status` — delivery is nog `unknown`
- `rating_or_social` — nog geen Google rating en ook geen bruikbaar social kanaal

Dit maakt het makkelijk om in de UI te tonen:
- "Dit restaurant heeft zich nog niet aangemeld — help ons de info compleet te maken"
- Of om gericht enrichment te draaien op specifieke velden

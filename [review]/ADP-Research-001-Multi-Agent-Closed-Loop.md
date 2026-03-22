# Multi-Agent Closed Loop Architecture — Lessen voor ADP

**Bron:** X/Twitter - @Voxyz_ai (7 feb 2026) — "I Built an AI Company with OpenClaw + Vercel + Supabase"
**Datum opgeslagen:** 11 februari 2026
**Relevantie voor ADP:** Hoog — directe blauwdruk voor multi-agent testing en architectuurbeslissingen

---

## Samenvatting artikel

Vox heeft 6 OpenClaw-agents opgezet die autonoom een website runnen (voxyz.space). Elke agent heeft een rol: Minion (beslissingen), Sage (strategie), Scout (intel), Quill (content), Xalt (social media), Observer (kwaliteitscontrole).

**Tech stack:**
- OpenClaw op VPS — het "brein" van de agents
- Next.js + Vercel — frontend + API-laag
- Supabase — single source of truth voor alle state

**Kernprobleem dat hij oploste:** Het verschil tussen "agents kunnen praten" en "agents runnen dingen autonoom." Daartussen zit een complete execute → feedback → re-trigger loop die ontbreekt in standaard setups.

### De closed loop die hij bouwde:

```
Agent stelt iets voor (Proposal)
     ↓
Auto-approval check
     ↓
Missie + stappen aanmaken (Mission + Steps)
     ↓
Worker claimt en voert uit
     ↓
Event uitzenden
     ↓
Nieuwe reacties triggeren
     ↓
Terug naar stap 1
```

### Drie pitfalls die hij tegenkwam:

**Pitfall 1 — Race conditions:** Twee systemen (VPS + Vercel) claimden hetzelfde werk. Fix: één systeem is executor, het andere is alleen control plane.

**Pitfall 2 — Proposals die blijven hangen:** Triggers maakten proposals aan maar sloegen de approval- en executie-stappen over. Fix: één centrale functie (`createProposalAndMaybeAutoApprove`) waar ALLE proposals doorheen gaan, ongeacht de bron.

**Pitfall 3 — Queue-buildup bij volle capaciteit:** Proposals bleven goedgekeurd worden terwijl de quota vol was, waardoor taken zich opstapelden. Fix: "Cap Gates" — afwijzen bij de poort vóórdat er een taak wordt aangemaakt.

### Andere slimme oplossingen:

- **Reaction Matrix met probability:** Niet elke event triggert altijd dezelfde reactie. 30% kans dat een agent reageert maakt het organischer.
- **Self-healing:** Elke 5 minuten checken of processen zijn vastgelopen (>30 min geen activiteit = auto-fail).
- **Policy-driven configuratie:** Alle limieten en gedragsregels in een database-tabel, niet hardcoded. Aanpasbaar zonder code te deployen.

### Zijn tijdlijn:

Het hele systeem (propose → execute → feedback → re-trigger) kostte ongeveer **één week** om te bouwen, exclusief bestaande infrastructuur.

---

## Analyse & Lessen voor ADP

### Directe parallellen met ADP

| Vox concept | ADP equivalent |
|---|---|
| Proposal | Intent (wat een consument zoekt) |
| Auto-approve | Matching (past intent bij capability?) |
| Mission + Steps | Negotiation (voorstel → tegenvoorstel → deal) |
| Worker execution | Transaction (uitvoering van de deal) |
| Event stream | ADP transaction log / reputation update |
| Trigger → nieuwe reactie | Nieuwe intents op basis van marktactiviteit |

### Pitfalls vertaald naar ADP

**Race conditions bij claims:** Als twee provider-agents dezelfde consumer-intent claimen, wie krijgt hem? ADP heeft een claim-mechanisme nodig — first-come-first-served, of een scoring systeem dat de beste match selecteert.

**Proposals die blijven hangen:** In ADP: een intent matcht met een capability maar de onderhandeling start niet. De hele keten intent → match → negotiate → transact moet één ononderbroken flow zijn. Eén centrale functie waar alle intents doorheen gaan (vergelijkbaar met Vox's `createProposalAndMaybeAutoApprove`).

**Queue-buildup:** Als een provider al 10 actieve onderhandelingen heeft, moeten nieuwe intents direct worden afgewezen bij de poort. Niet opstapelen. Cap Gates voor ADP: maximaal aantal gelijktijdige onderhandelingen per agent, configureerbaar per provider.

### Nieuwe inzichten voor ADP

**Reaction Matrix:** Providers hoeven niet op elke intent te reageren. Een probability-based filter (bijv. 70% kans op reactie bij goede match, 30% bij matige match) maakt het systeem realistischer en voorkomt overbelasting.

**Self-healing:** ADP heeft een heartbeat nodig die vastgelopen onderhandelingen detecteert. Als een negotiation 30 minuten geen activiteit heeft → automatisch failen → consumer informeren → intent opnieuw matchen met andere providers.

**Policy-driven configuratie:** Rate limits, max onderhandelingen per agent, auto-approve drempels, trust-level vereisten — allemaal in een configuratietabel, niet hardcoded. Aanpasbaar zonder deployment.

**Single entry point:** Eén functie voor intent-creatie met alle validatie erin: rate limiting, cap gates, matching, en negotiation-start. Of de intent nu van de consumer app komt, van een API-call, of van een andere agent — dezelfde flow.

### Rolvertaling voor de vijf-agent ADP test

| Rol | ADP functie | Gedrag |
|---|---|---|
| Consumer Agent | Stuurt intents | "Ik zoek een Aqara installateur, budget €150" |
| Provider Agent 1 | Aqara installateur | Matcht, onderhandelt, accepteert/weigert |
| Provider Agent 2 | FIBARO installateur | Concurreert om dezelfde intents |
| Market Agent | Intent-data analyse | Monitort trends, rapporteert inzichten |
| Trust Agent | Kwaliteitscontrole | Verifieert agents, checkt reputatie, flagged problemen |

---

## Actiepunten

1. **Multi-agent test opzetten met Frits:** Vijf OpenClaw-agents met ADP-rollen, draaiend op de Mac Mini, communicerend via de live API-endpoints op bidz.nl
2. **Claim-mechanisme ontwerpen:** Hoe gaat ADP om met meerdere providers die dezelfde intent willen claimen?
3. **Cap Gates implementeren:** Maximaal aantal gelijktijdige onderhandelingen per agent
4. **Self-healing toevoegen:** Heartbeat die vastgelopen negotiations detecteert en afhandelt
5. **Policy-tabel aanmaken:** Configureerbare limieten en gedragsregels in de database
6. **Reaction matrix overwegen:** Probability-based response systeem voor providers

---

## Referenties

- Origineel artikel: X/@Voxyz_ai (7 feb 2026)
- Live demo: voxyz.space
- Relevante ADP-documenten: ADP-Specification-v0.1.docx, ADP-Consumer-App-BuildContext.md

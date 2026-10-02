# Phase 0 — Scope and implementation decisions

Recorded 30 September 2026 from Docs-mobile Phases 0–1, the two hackathon reports, mobile HTML/MD references and the actual website source. These are implementation defaults selected for this work; device and production operations policies still require their stated validation.

## Product boundary

**Scope extension, 1 October 2026:** the user requested iOS implementation. Native iOS 15+ source, shared compatibility and release tooling are present; [Phase 8](../../Docs-mobile/08_iOS_Platform_and_Compatibility.md) and [Phase 9](../../Docs-mobile/09_iOS_Testing_and_Release.md) cover Apple compilation/device/signing acceptance. The original Android-first boundary below records the initial plan and is superseded for iOS scope. No Mac, iPhone or Apple runtime validation is claimed.

Android first (API 26+); Flutter 3.41.5 / Dart 3.11.3. Driver and Store Manager are native roles. Dispatcher, fleet allocation and Loader scanning remain in the existing Next.js application. iOS distribution is outside the initial release. A physical Android device is not currently connected; emulator/software checks cannot certify real camera behavior.

The initial shell is a labelled fixture build with no web login, fleet mutations or upload success simulation. Connected builds refuse fixture identities. Phases 2–6 now implement real backend workflows behind these interfaces; fixture builds remain explicitly separate.

## Decisions and owners

| Decision | Default for implementation | Owner / gate |
|---|---|---|
| Backend and identity | Existing Next.js/Firestore/S3; shared bcrypt verifier plus implemented native custom-token bridge | Backend/auth, Phase 2 |
| Operational writes | Validated server services; browser/native share business rules | Backend/operations, Phase 2–6 |
| HTTP/realtime | Separate configurable endpoint/path; API refresh baseline, hosted socket spike | Backend/events, Phase 2 |
| Business time | UTC instants, date-only service dates, Asia/Colombo display/business day | Backend + mobile, Phase 2 contracts |
| Units and linkage | Product/line IDs and explicit case/tray units; no crate/pack conversion | Backend/catalogue, before Phase 3 |
| Concurrency | Assignment/release, stop manifest/delivery and receipt tokens separated from trip counters | Backend/operations, Phase 2 |
| Evidence | Draft policy: JPEG/PNG, 2 MB per image, at most 3 images per stop; full/partial needs recipient and photo, signature optional unless server policy requires it | Operations/backend, approve/enforce before Phase 4 |
| Exception outcomes | Closed/refused/failed/skipped allow no recipient; reason plus applicable evidence | Operations/backend, Phase 4 |
| Offline access | Implemented maximum 12-hour credential lease after verified connected login; lock when expired and retain pending proof | Auth/operations, finalize before Phase 2 exit; active only in connected mode |
| Shared devices | No biometric convenience unlock by default; leaving account clears visible identity, keeps user-scoped pending work | Auth/mobile, Phase 2 |
| Data protection | AES-256-GCM for JSON payloads and evidence with user/context AAD; per-user keys in platform secure storage | Mobile, physical-device review before real data |
| Metadata | IDs, status, timestamps and entity keys remain plaintext in SQLite; this is payload encryption, not whole-database encryption | Product/security, accepted scope to review before operational release |
| Backups/retention | Android backup/transfer excluded; no automatic purge of drafts or unsynced evidence; accepted-media cleanup requires server acknowledgment and future approved retention policy | Mobile/operations, Phase 4/7 |
| Lost key | Fail closed and retain encrypted records; no automatic key replacement over existing data | Mobile, Phase 1 tests |
| Assets/UI | Bundle Inter, Lucide icons and selected supplied brand/mobile illustrations offline | Mobile, Phase 1 |
| Native navigation | Driver Today/Route/Activity/Profile; Store Home/Orders/Notifications/Profile, guarded deep links | Mobile, Phase 1 |
| GPS and notifications | In-app update baseline; foreground GPS/push later, continuous background tracking out of MVP | Product/mobile, Phase 6 |
| Release | Internal development APK first; production signing and distribution in Phase 7 | Release owner |

## Deterministic fixture

The canonical manifest is assets/fixtures/route.json. It is a synthetic UI/test dataset, separate from the website seed and operational Firestore. The CSV outlet/vehicle constraints were checked; no production allocation or travel-time feasibility checker has run for this sample.

- Fixed service date: 2026-09-30; Fresh trip 1 departs 04:30, finishes 07:30 (Sri Lanka time).
- Driver identity fixture-driver; Store identity fixture-store, outlet OUT005. No passwords, provider UIDs or production account provisioning are implied.
- VEH001: Peliyagoda reefer truck, actual CSV capacity 5,510 kg / 26.4 m³. Sample load 430 kg / 3 m³.
- OUT005, OUT006, OUT007: Fresh / Colombo / Peliyagoda / normal parking. No van-only outlet is placed on this truck.
- FIXTURE-VEH001-T1 links FIXTURE-STOP-01/02/03 to FIXTURE-ORDER-01/02/03.
- Each stop has explicitly distinct line IDs; sample milk 12 cases, yoghurt 8 trays.
- Source receiving windows: OUT005 04:00–07:45, OUT006 03:00–08:00, OUT007 05:30–08:00.
- Names/contact instructions are synthetic labels. The report's VEH006/tomorrow and source's WP-001/current UTC seed are not imported.

The isolated backend/native tests now add fixtures for partial receipt, deferral, held shortfall, closed outlet, offline proof, revision conflict and breakdown. Any test reset must preserve unsynced device evidence and operate only on isolated test data.

## Backend issues

B01–B12 execution and remaining gates are tracked in ../../Docs-mobile/WEBSITE_Alignment_and_Backend_Readiness.md with responsibility owners and phase gates. Shared web/native services and hardened browser callers are now implemented; local evidence is recorded in phase-2-7-verification.md. Hosted/physical acceptance is not inferred. No human team member assignment is invented.

## Phase 0 gate

Scope, defaults, IDs, fixture, screen traceability and backend responsibility boundaries are recorded. Outstanding physical-device choice, offline/evidence/retention policy approval, provisioning and hosted API contracts have owners and must resolve before their dependent phases. The original hackathon deadline is context, not a guarantee of native completion.

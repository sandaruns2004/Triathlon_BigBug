# Phase 2 — Authentication and backend contracts

**Execution status (30 September 2026): Implemented — verification pending.** Native SDK identity, shared web/native authentication, scoped v1 APIs, account recovery tooling and isolated tests are implemented. Hosted HTTPS and physical-phone checks, plus operations approval of policy defaults, remain release prerequisites.
Progress is maintained in [00__Work_List.md](00__Work_List.md) under [the repository rule](../AGENTS.md).

## Implemented tricky code

Implemented entry points: [native authentication](../waypoint-mobile/lib/core/auth/authentication_repository.dart), [shared verifier](../waypoint-flow/lib/auth/credentials.ts), [API schemas](../waypoint-flow/lib/mobile/domain.ts).
~~~dart
await firebase.signInWithCustomToken(bridge['customToken'] as String);
final principal = await revalidate(); // /me checks the current profile/version.
~~~
The custom token is exchanged by the SDK. API requests carry an ID token. The interceptor binds retries to the original account; offline access has a bounded lease. See [actual contracts](../waypoint-mobile/docs/api-contracts.md).

See [code recipes](CODE_Implementation_Recipes.md), [verification evidence](../waypoint-mobile/docs/phase-2-7-verification.md) and [the remaining release checklist](../waypoint-mobile/docs/release-checklist.md). Checked tasks record implementation; acceptance conditions requiring physical or hosted environments remain open.

**Outcome:** provisioned native users access authenticated, resource-scoped APIs with agreed JSON contracts.  
**Dependencies:** Phase 0; Flutter wiring uses Phase 1. **Estimate:** 2–3 working days. **Owners:** backend and Flutter developers.

## Existing integration surface

Baseline before Phase 2: the server used NextAuth credentials, bcrypt password hashes in Firestore and browser cookies/JWT sessions. Native bearer authentication now exists alongside browser sessions. Firestore Admin credentials and AWS keys must remain on the server.

Recommended first-release identity: preserve the existing Waypoint credential source and add a **Firebase custom-token bridge** for Flutter. This revises the earlier plan's mandatory password-provider migration after reviewing the working website. This sequence is now implemented in the shared verifier and native adapter.

1. A new rate-limited HTTPS native login endpoint calls the same normalized email/bcrypt verifier as NextAuth, including enabled/invited-account checks.
2. On successful verification, the server creates a Firebase custom token for a UID linked to the stable application user ID, binding the authentication version from the profile snapshot used to verify the password.
3. Flutter exchanges it using `signInWithCustomToken()`; the SDK then manages its authentication session.
4. Flutter sends the resulting **ID token** as the API bearer credential. The server verifies it, resolves the current Firestore profile and applies resource authorization. The custom token itself is not an API bearer token.

This bridge is supported by [Firebase's Flutter custom-auth flow](https://firebase.google.com/docs/auth/flutter/custom-auth); API validation follows [Admin ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens). A Firestore profile alone is not a Firebase Auth account. Link/provision identities deliberately. These technical capabilities support the proposal; the choice to retain Waypoint credentials is specific to this project.

Keep one password source: website activation/reset updates the shared Waypoint credential record, not an independent Firebase email/password credential. Invalidate prior browser sessions through a server-checked authentication version and revoke native refresh sessions; check revocation/current account status on protected requests. See [Firebase session management](https://firebase.google.com/docs/auth/admin/manage-sessions). A later move to Firebase email/password is a separate coordinated migration for both surfaces, not a prerequisite for this mobile release.

Carry the verified sign-in version as a server-issued claim such as `waypointAuthVersion` and compare the resulting ID-token/session version with the current profile on protected requests. [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims) support token assertions; this version policy is a Waypoint contract. Never refresh/reissue a stale sign-in context with the new version without fresh credential verification. A custom token issued before reset but exchanged afterward may create a provider session; its stale version must still fail `/me` and all protected API/subscription checks.

## Backend work

- [x] Extract a shared credential verifier from the existing web auth code; add generic errors, brute-force/rate limits and controlled invitation/enabled checks. Preserve browser login compatibility.
- [x] Implement implemented `POST /api/mobile/v1/auth/login`: verify credentials, provision/link a Firebase UID and return a custom token with no-store caching. Do not log/store passwords or custom tokens.
- [x] Link Driver and Store identities to stable application IDs such as `user-driver` and `user-store`. Maintain a unique UID→user mapping; do not infer it from display name or mutable email.
- [x] Define controlled invitation/activation/reset using the same Waypoint password source. Add reset/session-version checks to web and native principal paths, including provider refresh-token revocation on reset/disable. Do not enable an unrelated Firebase password-reset flow for bridged accounts.
- [x] Bind the sign-in version to the credential-verification snapshot, recheck it before issuing the bridge token and compare it on every protected request. Reject missing/mismatched versions; reset/disable must advance the version. Provider sign-in success alone cannot unlock application data.
- [x] Implement a server authentication resolver returning `userId`, `role`, `depotId`, `outletId`, account-enabled status and authorized assignments.
- [x] Add `/api/mobile/v1/me` and role/resource authorization helpers. Driver mutations verify trip assignment; Store reads/writes verify outlet ownership. Reject supplied IDs that belong to another user.
- [x] Version and document the native API. Reuse server domain services behind web and native routes so start/delivery/receipt business rules cannot diverge.
- [x] Map each proposed native route to an existing handler/shared service or a new gap. The `/api/mobile/v1` namespace is an adapter boundary, not a requirement to duplicate every existing handler. Harden the web callers of shared mutation services at the same time.
- [x] Create stable driver assignment, complete stop→order links, line manifests and entity revisions before publishing native route responses.
- [x] Scope concurrency tokens to their actual entity/rule: assignment/release, stop manifest/delivery and receipt versions. Keep ordinary trip-progress counters separate so syncing one unchanged stop does not invalidate another offline proof.
- [x] Retain assignment/release history so an authenticated original driver can submit preserved proof to restricted conflict intake after reassignment. Historical proof permission must not grant access to the new driver's route or authorize new delivery mutations.
- [x] Validate request shapes and return JSON errors consistently. Use `401` for missing/expired authentication and `403` for insufficient authorization.
- [ ] Agree the endpoint inventory in [the API reference](REFERENCE_Architecture_and_API.md). Missing catalogue, receipt, issue, media and sync routes need backend issues and fixtures now.
- [x] Publish a deterministic fixture manifest and repeatable test-only reset procedure. Preserve OUT005 if suitable, but use the actual verified route/order IDs, valid logistics constraints and an explicit `Asia/Colombo` service date.
- [ ] Run one signed-in route read on the chosen hosted API from a physical phone. Verify HTTPS, JSON errors, token verification and environment configuration; do not defer deployment feasibility until release day.

## Flutter authentication

- [x] Implement splash/session restoration, connected bridge sign-in, SDK token exchange and server profile loading. Route to the server-authorized role home; remove the production demo role switch.
- [x] Add generic sign-in errors, password visibility/autofill, preserved email and network retry.
- [x] Use the authentication SDK to manage provider credentials/token refresh. Do not manually store passwords or duplicate refresh credentials in the app database.
- [x] Retry an expired ID token once after SDK refresh; pause queued uploads if reauthentication is required. Never mark rejected operations as synced.
- [ ] Build invitation activation and password-reset link handling against the shared Waypoint service when these enter scope. Role/depot/outlet are assigned by operations and cannot be chosen in the activation form. Until recovery exists, show an honest operations-contact path.
- [x] Add deep-link guards: sign in first, then check access to the linked entity. Invalid/expired links produce a clear recovery path.
- [ ] Require a prior connected sign-in and approved cached-access policy for offline unlock. A first sign-in cannot succeed offline.
- [x] On an expired offline-access lease, lock protected content and retain queued evidence for the same user after reauthentication. Revocation can only be observed when the server is reachable; document this limitation.
- [x] On logout/account change, lock and segregate unsynced evidence. Provide a pending-work warning and controlled policy; never silently discard it or sync it under another identity.

Biometrics are an optional later local-unlock convenience after successful authentication, not a substitute for server authorization. Shared-device mode disables convenience unlock by default.

## Readiness spike

Before starting full Driver/Store API wiring, demonstrate:

1. Flutter sign-in → verified native token → scoped `me` response.
2. One assigned route and one store order returned as typed fixtures/real responses.
3. Driver A cannot start or complete Driver B’s trip.
4. Store A cannot read or mutate Store B’s order.
5. Token expiry pauses operations safely and resumes after reauthentication.
6. The same credentials work on web/mobile; reset/disable invalidates both old session paths, without exposing another user's cache or losing queued proof.
7. A real phone can reach the hosted API using its configured HTTP endpoint; realtime may still use the MVP refresh fallback.
8. Reset/disable between custom-token issuance and SDK exchange: any resulting stale sign-in context is rejected by the application APIs, and queued proof remains protected.

## Completion gates

- [x] Native token authentication and stable profile linking are real, not mocked.
- [x] API schemas, error semantics, versions, operation IDs and business-date conventions are checked in.
- [x] Existing web sign-in still works through the shared authorization model. Where reset is included, both surfaces use the same new credentials and old sessions are rejected. Where it is deferred, the support path and limitation are recorded.
- [x] Test fixtures use the same product/quantity units and IDs that later phases consume.
- [x] The MVP may defer invitation automation/push/biometrics, but connected sign-in, ownership checks and secure session behavior are mandatory.

**Exit gate:** mobile features can integrate without relying on browser cookies, anonymous access or fabricated server responses.

## Execution evidence and remaining gate

Software/test evidence is recorded in [phase-2-7-verification.md](../waypoint-mobile/docs/phase-2-7-verification.md). The code paths above replace the original proposed helpers. No production deployment, signing credential, physical camera acceptance or human policy approval is claimed. Keep this phase open until its applicable remaining release checks pass.

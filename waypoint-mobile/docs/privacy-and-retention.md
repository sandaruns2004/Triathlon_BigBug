# Privacy, storage and retention defaults

Updated 30 September 2026. These are implemented technical defaults awaiting operations/release approval.

The app records route/order data, actual delivered/received quantities, reasons, recipient name, optional drawn signature and delivery/issue photos. Data is scoped to the authenticated user and assigned depot/outlet; accepted proof is visible only to authorized related roles.

JSON payloads and app-owned images use AES-256-GCM with identity/context authentication and per-user platform secure-storage keys. SQLite identifiers, entity keys, statuses and timestamps remain plaintext. This is not whole-database encryption. Android backup and device transfer are excluded; uninstall or clear-data can destroy local evidence and keys.

Offline access requires a prior verified identity and a maximum 12-hour credential lease. An unreachable server cannot communicate revocation immediately. Expiry/sign-out locks visible data without deleting it. Same-user reauthentication can recover pending work; changed scope requires operations review.

Private S3 objects are accessed through authorized short-lived URLs. No public evidence URLs or base64 fallback are treated as accepted proof. Client tokens are not sent to object-storage hosts.

No automatic media purge or deletion service is enabled. Unsynced/rejected/conflicted originals and orphan files remain for recovery/audit. Accepted-media cleanup must wait for an approved retention period, canonical acknowledgment and reference checks. Operations must define lawful retention/deletion and support recovery before real recipient data is used.

The account management CLI can disable/reset/activate already provisioned users with server IAM. It is not an invitation portal. Diagnostics should use operation/request IDs, redact credentials and avoid photo/signature contents. No crash telemetry, push or continuous location collection is enabled by default.

Use synthetic isolated fixtures until the release owner approves policy, access and the physical-device checklist. See [offline recovery](offline-recovery.md) and [release acceptance](release-checklist.md).

On 1 October, iOS protection source was added: Keychain keys/profile use unlocked-only device-bound access without iCloud synchronization; the native bridge excludes app-owned Application Support files from backup and applies complete protection before SQLite opens. Payload/metadata encryption boundaries remain unchanged. Actual backup/file-protection/locked-phone behavior requires iPhone acceptance. Keychain items can outlive an uninstall while app files do not; reinstall is neither proof recovery nor a guaranteed credential wipe. See [iOS verification](ios-verification.md).

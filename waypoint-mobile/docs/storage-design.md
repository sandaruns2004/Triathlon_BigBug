# Local data foundation

Native database: Drift over SQLite, explicit parameterized SQL, payload schema 1. Database schema 1 contains route_snapshots, manifest_lines, drafts, evidence_metadata, proof_records, outbox_operations, activity, sync_checkpoints, cached_orders, order_drafts and notifications. Schema 2 adds sync_leases without recreating existing tables. SQL is hand-written and allowlisted; no generated ORM file or code-generation step is required.

Each data table has a composite user_id/id primary key, entity_id, status, encrypted payload, payload_version and UTC updated_at. Every repository read/write supplies a stable principal user ID; route/order IDs are entity keys, never authorization.

Payloads and media use AES-256-GCM with random nonces and associated data bound to user, record type and ID. The Android secure-storage adapter keeps separate user keys. SQLite IDs/status/time remain readable metadata: the database file is not wholly encrypted. No key/record is discarded on leaving a fixture identity. If a previously used key is missing, reads/writes fail instead of overwriting retained records.

Draft save is transactional. Proof/outbox insertion is one transaction and insert-only: failure or duplicate operation/proof IDs cannot partially save or rewrite original proof. Actual POD validation, files-before-completion enforcement, server replay and idempotency are Phase 4 work.

Media capture imports temporary files to persistent app support storage. Validate MIME magic/size, encrypt into a .pending file, flush, then atomically rename to .sealed before returning its descriptor. Evidence metadata is stored separately; orphan-file reconciliation and lost-camera-result handling are completed in Phase 4. Never claim a record saved when metadata failed. No temporary camera path is used as the evidence path.

A SQLite lease has user_id, owner and expiry. Acquire is transactional; another live worker is rejected, renewal/release check ownership, expired leases can be reclaimed. This is the worker-lock primitive, not an implemented sync worker. The future worker must renew leases, stop on lease loss and recover abandoned in-flight states.

Android main manifest excludes backups and device transfer and rejects cleartext transport. Development debug builds allow HTTP for local APIs. Camera uses image_picker's native adapter; permission/cancellation errors retain draft content.

A browser build is a UI preview and explicitly rejects draft writes; it has no SQLite/media durability claims. Automated native tests use real SQLite files and test-only in-memory keys. Physical-device secure-storage/restart/camera tests remain necessary before using operational data.

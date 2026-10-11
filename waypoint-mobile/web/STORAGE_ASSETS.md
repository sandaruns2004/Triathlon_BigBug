# Browser database assets

`drift_worker.js` and `sqlite3.wasm` are the unmodified official assets from
[Drift 2.35.0](https://github.com/simolus3/drift/releases/tag/drift-2.35.0), matching pubspec.lock.
Follow the [Drift web setup](https://drift.simonbinder.eu/platforms/web/) when upgrading them together.
Drift is MIT licensed; SQLite is public domain. See the upstream distribution for bundled notices.

SHA256:

- drift_worker.js: DF0066E75363A9BED59A14EEDBBDED421C1F5910F8379812DF164716AA2E6EED
- sqlite3.wasm: 13D3F11D05B39BA0618A7115FB41640A5D48B6300F5D3F325F554B42BD6688A4

The app rejects in-memory and unsafe multi-tab storage fallbacks. Site data and
browser keys are origin-specific; clearing site data removes local evidence.
Browser storage is not Android Keystore/iOS Keychain protection. Phone acceptance
and real browser camera/reload/quota tests remain separate gates.

# Android release checklist

Updated 30 September 2026. Release status: IN PROGRESS. An installable development build and release tooling are available; a production signed APK/AAB has not been certified.

## Verified software baseline

- [x] Flutter 3.41.5 / Dart 3.11.3 pinned dependency lock and Android API 26 minimum.
- [x] Driver/Store connected workflows and shared web Dispatcher/Loader services.
- [x] Unit/widget/domain/real HTTP checks recorded in [verification](phase-2-7-verification.md).
- [x] Connected Android emulator identity, durable proof/replay, Store creation and receipt/note.
- [x] Additive local schema migration, encrypted payload/media, backup exclusions and key-loss failure.
- [x] Development/staging/production app IDs; connected production refuses fixture/emulator settings and requires HTTPS.
- [x] Production Gradle task fails without protected signing properties; debug signing is not reused for production.
- [x] [Protected manual release workflow](../../.github/workflows/mobile-release.yml) prepares signed APK/AAB and checksums.
- [x] Handoff/API/offline/demo/privacy/AI disclosure documents.
- [ ] GitHub workflows run successfully in the actual repository. Checked-in workflow is not an executed run.

## External prerequisites and final acceptance

- [ ] Select a physical Android model/OS and preserve its unsynced data.
- [ ] Configure and verify the intended hosted HTTPS API/Firebase project and current principal/token exchange on that phone.
- [ ] Provision the release owner’s upload keystore and protected workflow secrets; verify certificate/alias/application ID.
- [ ] Verify private S3 PUT/finalize/view, checksum/magic validation, expired URL renewal and outage recovery on the hosted bucket.
- [ ] Approve evidence/signature/offline lease/retention/privacy defaults with operations.
- [ ] Test actual airplane-mode route/draft restore, process termination around file/DB/upload/receipt boundaries and reconnect.
- [ ] Test camera denied/interrupted, missing/corrupt attachment, low storage/device full and Android keystore behavior.
- [ ] Test connected forms with 320/390/wider screens, 1.8 text scale, keyboard, Back, thumbnails and accessibility on the target phone. Existing layout tests cover fixture shells.
- [ ] Rehearse one Store-created order through actual web planning/loading and native delivery/receipt; include D3 restoration, D5 hold and breakdown/historical review.
- [ ] Install signed production APK on a fresh phone and run the same journey; generate AAB if distribution requires it.
- [ ] Record artifact filenames, SHA-256, version/build, certificate, device/OS, backend project/API and date.
- [ ] Verify upgrade from the previous release with pending proof present, plus rollback/API compatibility.
- [ ] Supervise the hosted event publisher and verify recovery after commit/publisher interruption.
- [ ] Verify the chosen production API/container command with runtime-only server credentials. Docker image compilation is not hosted runtime acceptance.

## Protected signing

The release workflow expects a protected GitHub environment named mobile-production with:

| Secret name | Purpose |
|---|---|
| MOBILE_UPLOAD_KEYSTORE | Base64 upload keystore supplied by release owner |
| MOBILE_STORE_PASSWORD | Keystore password |
| MOBILE_KEY_PASSWORD | Signing key password |
| MOBILE_KEY_ALIAS | Signing alias |
| MOBILE_PRODUCTION_CONFIG | Connected production Firebase client/API JSON |

Never commit these values. The workflow creates ignored android/key.properties and android/upload.jks transiently and removes them after the job. Server Firebase/Admin/AWS credentials must not be in client configuration.

For local release, prepare ignored android/key.properties with storeFile, storePassword, keyPassword and keyAlias using the authorized keystore. Use an absolute keystore path. Copy config/production.example.json to ignored config/production.json with verified public client settings.

~~~powershell
flutter build apk --release --flavor production --dart-define-from-file=config/production.json
flutter build appbundle --release --flavor production --dart-define-from-file=config/production.json
Get-FileHash build/app/outputs/flutter-apk/app-production-release.apk -Algorithm SHA256
~~~

No production key was generated or substituted during this implementation.

## MVP scope and privacy

Included: native Driver/Store, shared authenticated REST services, encrypted local capture, foreground/manual sync, scoped in-app updates and external navigation.

Deferred: push, continuous GPS, guaranteed background transfer, socket rooms, full invitation/recovery UI, typed signature acknowledgment and PDF export. iOS source/IPA tooling was added on 1 October; separate Mac/phone/signing acceptance is tracked in [iOS setup](ios-setup-and-release.md) and [Phase 9](../../Docs-mobile/09_iOS_Testing_and_Release.md). This checklist remains the Android release gate. App notifications remain available via authorized refresh.

[Privacy/retention](privacy-and-retention.md) describes metadata and recovery limitations. Never log passwords, tokens, recipient signatures or photo contents. Diagnostics may reference operation/request IDs under controlled access.

Development artifact details belong in [verification](phase-2-7-verification.md). Development signing/configuration do not satisfy this final release gate.

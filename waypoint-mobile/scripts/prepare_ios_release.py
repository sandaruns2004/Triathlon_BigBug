"""Prepare an owner-supplied App Store profile/config on an ephemeral Mac runner.

Never prints credentials or decoded profile contents. Does not upload a release.
"""
import base64
import datetime
import hashlib
import json
import os
import pathlib
import plistlib
import re
import subprocess
import sys
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUNDLE = "lk.waypoint.waypointMobile"


def validate_client_configuration(config):
    allowed = {
        "APP_ENV", "APP_MODE", "API_BASE_URL", "SOCKET_URL", "SOCKET_PATH",
        "FIREBASE_PROJECT_ID", "FIREBASE_API_KEY", "FIREBASE_APP_ID",
        "FIREBASE_SENDER_ID", "FIREBASE_IOS_BUNDLE_ID",
    }
    if set(config) - allowed:
        raise ValueError("Unknown client fields; never bundle server credentials or emulator settings")
    if config.get("APP_ENV") != "production" or config.get("APP_MODE") != "connected":
        raise ValueError("A connected production configuration is required")
    for field in ("API_BASE_URL", "SOCKET_URL"):
        uri = urlparse(config.get(field, ""))
        if uri.scheme != "https" or not uri.hostname or uri.username or uri.password:
            raise ValueError("Production endpoints must be absolute HTTPS URLs")
        if uri.hostname in ("localhost", "127.0.0.1", "10.0.2.2", "::1") or "YOUR-" in uri.hostname.upper():
            raise ValueError("A verified hosted endpoint is required")
    if config.get("FIREBASE_IOS_BUNDLE_ID") != BUNDLE:
        raise ValueError("Firebase Apple bundle ID does not match production")
    if not re.fullmatch(r"1:\d+:ios:[a-fA-F0-9]+", config.get("FIREBASE_APP_ID", "")):
        raise ValueError("Use the Firebase Apple app ID")
    for field in ("FIREBASE_PROJECT_ID", "FIREBASE_API_KEY", "FIREBASE_SENDER_ID"):
        value = config.get(field, "")
        if not value or any(marker in value.upper() for marker in ("REPLACE", "YOUR-", "DEMO-")):
            raise ValueError("Firebase client configuration is missing or still a placeholder")


def validate_profile(profile, team, certificate_sha1):
    if not re.fullmatch(r"[A-Z0-9]{10}", team):
        raise ValueError("Invalid Apple team identifier")
    if not re.fullmatch(r"[A-F0-9]{40}", certificate_sha1):
        raise ValueError("Invalid distribution certificate SHA-1")
    if team not in profile.get("TeamIdentifier", []):
        raise ValueError("Profile belongs to another Apple team")
    entitlements = profile.get("Entitlements", {})
    prefix = profile.get("ApplicationIdentifierPrefix", [""])[0]
    if entitlements.get("application-identifier") != f"{prefix}.{BUNDLE}":
        raise ValueError("Use an explicit production App Store provisioning profile")
    if entitlements.get("com.apple.developer.team-identifier") != team:
        raise ValueError("Profile team entitlement mismatch")
    groups = entitlements.get("keychain-access-groups", [])
    if f"{prefix}.{BUNDLE}" not in groups and f"{prefix}.*" not in groups:
        raise ValueError("Profile does not authorize this app's Keychain group")
    if entitlements.get("get-task-allow") or profile.get("ProvisionedDevices") or profile.get("ProvisionsAllDevices"):
        raise ValueError("This workflow requires an App Store distribution profile")
    expiry = profile.get("ExpirationDate")
    if not isinstance(expiry, datetime.datetime) or expiry.replace(tzinfo=datetime.timezone.utc) <= datetime.datetime.now(datetime.timezone.utc):
        raise ValueError("Provisioning profile expired or missing expiry")
    hashes = {hashlib.sha1(cert).hexdigest().upper() for cert in profile.get("DeveloperCertificates", [])}
    if certificate_sha1 not in hashes:
        raise ValueError("Distribution certificate is not authorized by the profile")
    uuid = profile.get("UUID", "")
    if not re.fullmatch(r"[A-Fa-f0-9-]{36}", uuid):
        raise ValueError("Profile UUID is invalid")
    return uuid


def prepare():
    if sys.platform != "darwin":
        raise ValueError("Signed iOS preparation requires the authorized macOS runner")
    config = json.loads(os.environ["IOS_CLIENT_CONFIGURATION"])
    validate_client_configuration(config)
    team = os.environ["IOS_TEAM_ID"]
    certificate = os.environ["IOS_CERTIFICATE_SHA1"].upper()
    temporary = pathlib.Path(os.environ["RUNNER_TEMP"])
    profile_path = temporary / "waypoint.mobileprovision"
    profile_path.write_bytes(base64.b64decode(os.environ["IOS_PROFILE_BASE64"], validate=True))
    profile_path.chmod(0o600)
    decoded = subprocess.check_output(["security", "cms", "-D", "-i", str(profile_path)], stderr=subprocess.DEVNULL)
    profile = plistlib.loads(decoded)
    uuid = validate_profile(profile, team, certificate)
    identities = subprocess.check_output(["security", "find-identity", "-v", "-p", "codesigning", str(temporary / "waypoint-signing.keychain-db")], text=True)
    if certificate not in identities.upper():
        raise ValueError("Matching valid distribution identity is not installed")
    # Support both historical and Xcode 16+ profile search locations.
    installed = []
    for directory in ("Library/MobileDevice/Provisioning Profiles", "Library/Developer/Xcode/UserData/Provisioning Profiles"):
        destination = pathlib.Path.home() / directory / f"{uuid}.mobileprovision"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(profile_path.read_bytes())
        destination.chmod(0o600)
        installed.append(str(destination))
    (temporary / "waypoint-profile-path.txt").write_text(json.dumps(installed))
    (ROOT / "config/ios-production.json").write_text(json.dumps(config))
    (ROOT / "ios/Flutter/Signing.local.xcconfig").write_text(
        f"DEVELOPMENT_TEAM = {team}\nCODE_SIGN_STYLE = Manual\n"
        f"CODE_SIGN_IDENTITY = {certificate}\nPROVISIONING_PROFILE_SPECIFIER = {uuid}\n"
    )
    export = {
        "method": "app-store-connect", "destination": "export", "teamID": team,
        "signingStyle": "manual", "signingCertificate": certificate,
        "provisioningProfiles": {BUNDLE: uuid}, "uploadSymbols": True,
        "manageAppVersionAndBuildNumber": False,
    }
    (ROOT / "ios/ExportOptions.local.plist").write_bytes(plistlib.dumps(export))
    print("Prepared validated iOS client configuration and owner-supplied App Store signing profile.")


if __name__ == "__main__":
    try:
        prepare()
    except Exception:
        # JSON/profile/parser errors can contain private inputs: keep logs generic.
        raise SystemExit("iOS release preparation failed. Check protected configuration, profile, team and certificate.")

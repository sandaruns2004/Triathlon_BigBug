import copy
import datetime
import hashlib
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from prepare_ios_release import validate_client_configuration, validate_profile


class ReleaseValidation(unittest.TestCase):
    def setUp(self):
        self.config = {
            "APP_ENV": "production", "APP_MODE": "connected",
            "API_BASE_URL": "https://example.com/api/mobile/v1/",
            "SOCKET_URL": "https://example.com/",
            "FIREBASE_PROJECT_ID": "waypoint-test",
            "FIREBASE_API_KEY": "synthetic-public-client-key",
            "FIREBASE_APP_ID": "1:123:ios:abc123", "FIREBASE_SENDER_ID": "123",
            "FIREBASE_IOS_BUNDLE_ID": "lk.waypoint.waypointMobile",
        }
        self.team = "TESTTEAM01"
        # Synthetic bytes: no Apple certificate is created or certified.
        self.cert = b"synthetic-profile-certificate"
        self.sha1 = hashlib.sha1(self.cert).hexdigest().upper()
        self.profile = {
            "TeamIdentifier": [self.team], "ApplicationIdentifierPrefix": [self.team],
            "Entitlements": {"application-identifier": self.team + ".lk.waypoint.waypointMobile", "com.apple.developer.team-identifier": self.team, "keychain-access-groups": [self.team + ".*"], "get-task-allow": False},
            "ExpirationDate": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1),
            "DeveloperCertificates": [self.cert], "UUID": "12345678-1234-1234-1234-123456789abc",
        }

    def test_valid_contract(self):
        validate_client_configuration(self.config)
        self.assertEqual(validate_profile(self.profile, self.team, self.sha1), self.profile["UUID"])

    def test_no_emulator_or_server_credentials(self):
        for key, value in [("AUTH_EMULATOR_HOST", "localhost"), ("AWS_SECRET_ACCESS_KEY", "synthetic"), ("FIREBASE_PRIVATE_KEY", "synthetic")]:
            with self.assertRaises(ValueError):
                validate_client_configuration({**self.config, key: value})

    def test_wrong_platform_or_unsafe_endpoint(self):
        for key, value in [("FIREBASE_APP_ID", "1:123:android:abc"), ("FIREBASE_IOS_BUNDLE_ID", "lk.waypoint.waypointMobile.dev"), ("API_BASE_URL", "http://example.com/"), ("API_BASE_URL", "https://password@example.com/"), ("API_BASE_URL", "https://localhost/")]:
            with self.assertRaises(ValueError):
                validate_client_configuration({**self.config, key: value})

    def test_expired_wrong_team_or_certificate(self):
        expired = {**self.profile, "ExpirationDate": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)}
        with self.assertRaises(ValueError):
            validate_profile(expired, self.team, self.sha1)
        with self.assertRaises(ValueError):
            validate_profile(self.profile, "OTHERTEAM1", self.sha1)
        with self.assertRaises(ValueError):
            validate_profile(self.profile, self.team, "0" * 40)

    def test_wildcard_and_non_store_profiles(self):
        for change in ({"ProvisionedDevices": ["test-device"]}, {"ProvisionsAllDevices": True}):
            with self.assertRaises(ValueError):
                validate_profile({**self.profile, **change}, self.team, self.sha1)
        for key, value in [("application-identifier", self.team + ".*"), ("get-task-allow", True), ("keychain-access-groups", ["OTHERTEAM1.*"])]:
            profile = copy.deepcopy(self.profile)
            profile["Entitlements"][key] = value
            with self.assertRaises(ValueError):
                validate_profile(profile, self.team, self.sha1)


if __name__ == "__main__":
    unittest.main()

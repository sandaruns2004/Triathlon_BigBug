"""Portable semantic check; does not substitute for Xcode compilation/signing."""
import json
import pathlib
import plistlib
import re
import struct
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
IOS = ROOT / "ios"


def parse_project(text):
    text = re.sub(r"/\*.*?\*/|//[^\n]*", "", text, flags=re.S)
    tokens = re.findall(r'"(?:\\.|[^"\\])*"|[{}()=;,]|[^\s{}()=;,]+', text)
    position = 0

    def take():
        nonlocal position
        token = tokens[position]
        position += 1
        return token

    def expect(token):
        assert take() == token, "Malformed Xcode project"

    def value():
        token = take()
        if token == "{":
            result = {}
            while tokens[position] != "}":
                key = take()
                key = json.loads(key) if key.startswith('"') else key
                expect("=")
                assert key not in result, "Duplicate Xcode object/setting"
                result[key] = value()
                expect(";")
            expect("}")
            return result
        if token == "(":
            result = []
            while tokens[position] != ")":
                result.append(value())
                if tokens[position] != ")":
                    expect(",")
            expect(")")
            return result
        return json.loads(token) if token.startswith('"') else token

    result = value()
    assert position == len(tokens), "Unexpected trailing Xcode tokens"
    return result


def load_plist(path):
    with path.open("rb") as stream:
        return plistlib.load(stream)


def check():
    project = parse_project((IOS / "Runner.xcodeproj/project.pbxproj").read_text())
    objects = project["objects"]
    targets = [o for o in objects.values() if o.get("isa") == "PBXNativeTarget"]
    runner = next(o for o in targets if o["name"] == "Runner")
    configs = {
        objects[key]["name"]: objects[key]
        for key in objects[runner["buildConfigurationList"]]["buildConfigurations"]
    }
    expected_schemes = {"development": "waypoint-dev", "staging": "waypoint-staging", "production": "waypoint"}
    for flavor, url_scheme in expected_schemes.items():
        scheme = ET.parse(IOS / f"Runner.xcodeproj/xcshareddata/xcschemes/{flavor}.xcscheme").getroot()
        for action, mode in {"LaunchAction": "Debug", "TestAction": "Debug", "AnalyzeAction": "Debug", "ProfileAction": "Profile", "ArchiveAction": "Release"}.items():
            assert scheme.find(action).attrib["buildConfiguration"] == f"{mode}-{flavor}"
        bundle = "lk.waypoint.waypointMobile" + {"development": ".dev", "staging": ".staging", "production": ""}[flavor]
        for mode in ("Debug", "Profile", "Release"):
            name = f"{mode}-{flavor}"
            conf = configs[name]
            assert "PRODUCT_BUNDLE_IDENTIFIER" not in conf["buildSettings"], "Target overrides flavor xcconfig"
            reference = objects[conf["baseConfigurationReference"]]
            config_path = IOS / reference["path"]
            xcconfig = config_path.read_text()
            assert f"PRODUCT_BUNDLE_IDENTIFIER = {bundle}\n" in xcconfig
            assert f"WAYPOINT_URL_SCHEME = {url_scheme}\n" in xcconfig
            assert "IPHONEOS_DEPLOYMENT_TARGET = 15.0" in xcconfig
            assert f"Pods-Runner.{name.lower()}.xcconfig" in xcconfig
            assert '#include "Generated.xcconfig"' in xcconfig
            plist_path = re.search(r"^INFOPLIST_FILE = (.+)$", xcconfig, re.M)[1].strip()
            info = load_plist(IOS / plist_path)
            ats = info.get("NSAppTransportSecurity", {})
            assert not ats.get("NSAllowsArbitraryLoads", False)
            assert bool(ats.get("NSAllowsLocalNetworking")) == (name == "Debug-development")
            assert not info.get("UIBackgroundModes"), "MVP has no background transfer/location guarantee"
            assert info["NSCameraUsageDescription"] and info["NSPhotoLibraryUsageDescription"]
            assert "NSMicrophoneUsageDescription" not in info
            assert info["CFBundleURLTypes"][0]["CFBundleURLSchemes"] == ["$(WAYPOINT_URL_SCHEME)"]
            assert f"'{name}' => :{'debug' if mode == 'Debug' else 'release'}" in (IOS / "Podfile").read_text()
            assert "CODE_SIGN_ENTITLEMENTS = Runner/Runner.entitlements" in xcconfig
    for item in IOS.rglob("*.plist"):
        load_plist(item)
    for pattern in ("*.storyboard", "*.xcscheme", "*.xcworkspacedata"):
        for item in IOS.rglob(pattern):
            ET.parse(item)
    manifest = load_plist(IOS / "Runner/PrivacyInfo.xcprivacy")
    assert manifest["NSPrivacyTracking"] is False
    assert manifest["NSPrivacyTrackingDomains"] == []
    assert any(o.get("path") == "PrivacyInfo.xcprivacy" for o in objects.values())
    assert load_plist(IOS / "Runner/Runner.entitlements")["keychain-access-groups"] == ["$(AppIdentifierPrefix)$(PRODUCT_BUNDLE_IDENTIFIER)"]
    assets = IOS / "Runner/Assets.xcassets/AppIcon.appiconset"
    for icon in json.loads((assets / "Contents.json").read_text())["images"]:
        png = (assets / icon["filename"]).read_bytes()
        assert png[:8] == b"\x89PNG\r\n\x1a\n"
        size = round(float(icon["size"].split("x")[0]) * float(icon["scale"].rstrip("x")))
        assert struct.unpack(">II", png[16:24]) == (size, size)
        assert png[25] in (0, 2), "App icons must be opaque"
    demo = json.loads((ROOT / "config/ios-emulator.json").read_text())
    assert demo["AUTH_EMULATOR_HOST"] == "localhost" and ":ios:" in demo["FIREBASE_APP_ID"]
    assert demo["FIREBASE_PROJECT_ID"].startswith("demo-")
    print("PASS: iOS project/schemes, isolated ATS, permissions, Keychain, privacy manifest, icons and demo config")


if __name__ == "__main__":
    check()

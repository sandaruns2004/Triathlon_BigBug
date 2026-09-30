import Flutter
import UIKit
import XCTest

class RunnerTests: XCTestCase {

  func testEvidencePermissionAndPrivacyConfiguration() {
    let info = Bundle.main.infoDictionary ?? [:]
    XCTAssertFalse((info["NSCameraUsageDescription"] as? String ?? "").isEmpty)
    XCTAssertFalse((info["NSPhotoLibraryUsageDescription"] as? String ?? "").isEmpty)
    XCTAssertNil(info["NSMicrophoneUsageDescription"])
    XCTAssertNil(info["UIBackgroundModes"])
    let ats = info["NSAppTransportSecurity"] as? [String: Any] ?? [:]
    XCTAssertNotEqual(ats["NSAllowsArbitraryLoads"] as? Bool, true)
    let manifest = Bundle.main.url(forResource: "PrivacyInfo", withExtension: "xcprivacy")
    XCTAssertNotNil(manifest)
  }

}

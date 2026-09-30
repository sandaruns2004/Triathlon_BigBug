import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    let channel = FlutterMethodChannel(
      name: "lk.waypoint/storage",
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    channel.setMethodCallHandler { call, result in
      guard call.method == "protectStorage" else {
        result(FlutterMethodNotImplemented)
        return
      }
      do {
        guard let arguments = call.arguments as? [String: Any],
              let requestedPath = arguments["path"] as? String else {
          throw NSError(domain: "WaypointStorage", code: 1)
        }
        let manager = FileManager.default
        let support = try manager.url(
          for: .applicationSupportDirectory, in: .userDomainMask,
          appropriateFor: nil, create: true
        ).resolvingSymlinksInPath().standardizedFileURL
        var requested = URL(fileURLWithPath: requestedPath, isDirectory: true)
          .resolvingSymlinksInPath().standardizedFileURL
        guard requested.path == support.path else {
          throw NSError(domain: "WaypointStorage", code: 2)
        }
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try requested.setResourceValues(values)
        try manager.setAttributes(
          [.protectionKey: FileProtectionType.complete], ofItemAtPath: requested.path
        )
        // Existing files from an earlier installation receive the same policy.
        var enumerationError: Error?
        guard let contents = manager.enumerator(
          at: requested, includingPropertiesForKeys: [.isSymbolicLinkKey],
          options: [], errorHandler: { _, error in
            enumerationError = error
            return false
          }
        ) else {
          throw NSError(domain: "WaypointStorage", code: 3)
        }
        for case let entry as URL in contents {
          var file = entry
          let attributes = try file.resourceValues(forKeys: [.isSymbolicLinkKey])
          guard attributes.isSymbolicLink != true else {
            contents.skipDescendants()
            continue
          }
          try file.setResourceValues(values)
          try manager.setAttributes(
            [.protectionKey: FileProtectionType.complete], ofItemAtPath: file.path
          )
        }
        if let error = enumerationError { throw error }
        result(nil)
      } catch {
        // No file paths or private data in the platform error.
        result(FlutterError(
          code: "storage_protection", message: "Device storage protection is unavailable.",
          details: nil
        ))
      }
    }
  }
}

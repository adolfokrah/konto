import Flutter
import UIKit
import Firebase
import MessageUI

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    
    let controller: FlutterViewController = window?.rootViewController as! FlutterViewController
    let smsChannel = FlutterMethodChannel(name: "com.konto.sms", binaryMessenger: controller.binaryMessenger)
    
    smsChannel.setMethodCallHandler { (call: FlutterMethodCall, result: @escaping FlutterResult) in
      if call.method == "openSmsComposer" {
        self.openSmsComposer(call: call, result: result)
      } else {
        result(FlutterMethodNotImplemented)
      }
    }
    
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  private func openSmsComposer(call: FlutterMethodCall, result: @escaping FlutterResult) {
    guard let args = call.arguments as? [String: Any],
          let message = args["message"] as? String,
          let recipients = args["recipients"] as? [String] else {
      result(FlutterError(code: "INVALID_ARGUMENTS", message: "Invalid arguments", details: nil))
      return
    }
    
    DispatchQueue.main.async {
      if MFMessageComposeViewController.canSendText() {
        let messageController = MFMessageComposeViewController()
        messageController.messageComposeDelegate = self
        messageController.body = message
        messageController.recipients = recipients
        
        if let rootViewController = self.window?.rootViewController {
          rootViewController.present(messageController, animated: true) {
            result(["success": true])
          }
        } else {
          result(FlutterError(code: "NO_ROOT_VIEW_CONTROLLER", message: "No root view controller found", details: nil))
        }
      } else {
        result(FlutterError(code: "SMS_NOT_AVAILABLE", message: "SMS is not available on this device", details: nil))
      }
    }
  }
}

// MARK: - MFMessageComposeViewControllerDelegate
extension AppDelegate: MFMessageComposeViewControllerDelegate {
  func messageComposeViewController(_ controller: MFMessageComposeViewController, didFinishWith result: MessageComposeResult) {
    controller.dismiss(animated: true, completion: nil)
  }
}

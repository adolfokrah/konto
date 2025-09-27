package com.hoga.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.konto.sms"
    private val SMS_PERMISSION_REQUEST_CODE = 1001

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "openSmsComposer" -> {
                    val message = call.argument<String>("message") ?: ""
                    val recipients = call.argument<List<String>>("recipients") ?: emptyList()
                    
                    try {
                        // Check SMS permission first
                        if (checkSmsPermission()) {
                            openSmsComposer(message, recipients)
                            result.success(mapOf("success" to true))
                        } else {
                            requestSmsPermission()
                            result.success(mapOf("success" to false, "error" to "SMS permission required"))
                        }
                    } catch (e: Exception) {
                        result.success(mapOf("success" to false, "error" to e.message))
                    }
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun checkSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestSmsPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.SEND_SMS),
            SMS_PERMISSION_REQUEST_CODE
        )
    }

    private fun openSmsComposer(message: String, recipients: List<String>) {
        println("SMS Debug: Opening SMS composer with message: $message")
        println("SMS Debug: Recipients: $recipients")
        
        if (recipients.isEmpty()) {
            throw Exception("No recipients provided")
        }
        
        // Join all recipients with comma (standard for SMS apps)
        val allRecipients = recipients.joinToString(",")
        println("SMS Debug: Using all recipients: $allRecipients")
        
        try {
            // Method 1: Simple SMS intent with all recipients - most compatible
            val smsUri = Uri.parse("sms:$allRecipients")
            val intent = Intent(Intent.ACTION_VIEW, smsUri).apply {
                putExtra("sms_body", message)
            }
            
            println("SMS Debug: Created intent with URI: sms:$allRecipients")
            
            // Check all activities that can handle this intent
            val packageManager = packageManager
            val activities = packageManager.queryIntentActivities(intent, 0)
            println("SMS Debug: Found ${activities.size} apps that can handle SMS")
            
            for (activity in activities) {
                println("SMS Debug: - ${activity.activityInfo.packageName}: ${activity.activityInfo.name}")
            }
            
            if (activities.isNotEmpty()) {
                println("SMS Debug: Starting SMS activity with multiple recipients")
                startActivity(intent)
                return
            } else {
                println("SMS Debug: No activities found for SMS intent")
            }
            
        } catch (e: Exception) {
            println("SMS Debug: SMS intent failed with exception: ${e.message}")
        }
        
        try {
            // Method 2: Try with SENDTO action and all recipients
            val sendToIntent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("smsto:$allRecipients")
                putExtra("sms_body", message)
            }
            
            println("SMS Debug: Trying SENDTO method with all recipients")
            val sendToActivities = packageManager.queryIntentActivities(sendToIntent, 0)
            println("SMS Debug: SENDTO found ${sendToActivities.size} apps")
            
            if (sendToActivities.isNotEmpty()) {
                println("SMS Debug: Starting SENDTO SMS activity with multiple recipients")
                startActivity(sendToIntent)
                return
            }
            
        } catch (e: Exception) {
            println("SMS Debug: SENDTO method failed: ${e.message}")
        }
        
        try {
            // Method 3: Try to explicitly target Messages app if we can find it
            val messagesIntent = Intent().apply {
                action = Intent.ACTION_SEND
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, message)
                putExtra("address", allRecipients)
                setPackage("com.google.android.apps.messaging") // Google Messages package
            }
            
            println("SMS Debug: Trying to target Google Messages directly with all recipients")
            if (messagesIntent.resolveActivity(packageManager) != null) {
                println("SMS Debug: Google Messages found, starting activity")
                startActivity(messagesIntent)
                return
            }
            
        } catch (e: Exception) {
            println("SMS Debug: Direct Messages targeting failed: ${e.message}")
        }
        
        println("SMS Debug: All methods failed - Messages app may not be properly configured")
        throw Exception("Could not open Messages app. The app exists but cannot handle SMS intents.")
    }
}

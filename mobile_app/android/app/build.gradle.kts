import java.security.MessageDigest
import java.util.Base64

plugins {
    id("com.android.application")
    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    // END: FlutterFire Configuration
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.hoga.app"
    compileSdk = 35
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.hoga.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        
        // Updated to minSdk 24 to support integration_test plugin
        minSdkVersion(24)
        targetSdkVersion(35)
        compileSdk = 36
        
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        
        // Remove any NDK abiFilters to avoid conflicts with splits configuration
        // NDK ABI filtering is handled by the splits block above
    }

    // APK splitting disabled in Gradle - using Flutter's --split-per-abi flag instead
    // splits {
    //     abi {
    //         isEnable = true
    //         reset()
    //         include("arm64-v8a", "armeabi-v7a", "x86_64")
    //         isUniversalApk = true
    //     }
    // }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}

// Task to generate app signature hash for SMS Retriever API
tasks.register("generateAppSignature") {
    doLast {
        val packageName = android.defaultConfig.applicationId
        println("🔍 Generating App Signature Hash for: $packageName")
        
        try {
            // Get debug keystore SHA256 fingerprint
            val keystorePath = "${System.getProperty("user.home")}/.android/debug.keystore"
            val keytoolCmd = listOf(
                "keytool", "-list", "-v",
                "-keystore", keystorePath,
                "-alias", "androiddebugkey",
                "-storepass", "android",
                "-keypass", "android"
            )
            
            val process = ProcessBuilder(keytoolCmd)
                .redirectErrorStream(true)
                .start()
            
            val output = process.inputStream.bufferedReader().readText()
            process.waitFor()
            
            val sha256Regex = Regex("SHA256:\\s*([A-F0-9:]+)")
            val sha256Match = sha256Regex.find(output)
            
            if (sha256Match != null) {
                val sha256Fingerprint = sha256Match.groupValues[1]
                val appSignature = generateAppSignatureHash(packageName!!, sha256Fingerprint)
                
                println("🔐 SHA256 Fingerprint: $sha256Fingerprint")
                println("✅ App Signature Hash: $appSignature")
                println("")
                println("📋 For SMS Retriever API, append this to your SMS:")
                println("   Your verification code is: 123456 $appSignature")
                println("")
                println("🔗 For Firebase App Check, use: $appSignature")
            } else {
                println("❌ Could not extract SHA256 fingerprint from keystore")
            }
        } catch (e: Exception) {
            println("❌ Error generating app signature: ${e.message}")
            println("Run manually: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android")
        }
    }
}

fun generateAppSignatureHash(packageName: String, sha256Fingerprint: String): String {
    val sha256Clean = sha256Fingerprint.replace(":", "").uppercase()
    val appInfo = "$packageName $sha256Clean"
    
    val messageDigest = MessageDigest.getInstance("SHA-256")
    val hashBytes = messageDigest.digest(appInfo.toByteArray())
    
    // Take first 9 bytes and encode to base64
    val truncated = hashBytes.take(9).toByteArray()
    val base64Encoded = Base64.getEncoder().encodeToString(truncated)
    
    // Remove padding and take first 11 characters
    return base64Encoded.replace("=", "").take(11)
}

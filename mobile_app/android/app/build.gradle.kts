import java.util.Properties
import java.io.FileInputStream

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
    namespace = "com.hoganame.hogapay"
    compileSdk = 35
    ndkVersion = "28.2.13676358"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    // Load signing properties
    val keystoreProperties = Properties()
    val keystorePropertiesFile = rootProject.file("key.properties")
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(FileInputStream(keystorePropertiesFile))
    }

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String? ?: ""
            keyPassword = keystoreProperties["keyPassword"] as String? ?: ""
            storeFile = file(keystoreProperties["storeFile"] as String? ?: "")
            storePassword = keystoreProperties["storePassword"] as String? ?: ""
        }
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.hoganame.hogapay"
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
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

flutter {
    source = "../.."
}

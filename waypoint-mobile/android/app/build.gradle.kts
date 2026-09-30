import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val signingFile = rootProject.file("key.properties")
val releaseProperties = Properties()
if (signingFile.exists()) signingFile.inputStream().use { releaseProperties.load(it) }
val productionReleaseRequested = gradle.startParameter.taskNames.any { it.contains("ProductionRelease", ignoreCase = true) }
if (productionReleaseRequested && !signingFile.exists()) throw GradleException("Production release requires protected android/key.properties and its upload keystore.")

android {
    namespace = "lk.waypoint.waypoint_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "lk.waypoint.waypoint_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 26
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    flavorDimensions += "environment"
    productFlavors {
        create("development") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
        }
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
        }
        create("production") {
            dimension = "environment"
        }
    }
    signingConfigs {
        if (signingFile.exists()) create("waypointRelease") {
            keyAlias = releaseProperties.getProperty("keyAlias")
            keyPassword = releaseProperties.getProperty("keyPassword")
            storeFile = file(releaseProperties.getProperty("storeFile"))
            storePassword = releaseProperties.getProperty("storePassword")
        }
    }
    buildTypes {
        release {
            if (signingFile.exists()) signingConfig = signingConfigs.getByName("waypointRelease")
        }
    }
}

flutter {
    source = "../.."
}

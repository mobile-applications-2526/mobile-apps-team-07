package org.dadez.safarban.data.location

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.cinterop.ExperimentalForeignApi
import platform.CoreLocation.CLLocationManager
import platform.CoreLocation.kCLAuthorizationStatusAuthorizedAlways
import platform.CoreLocation.kCLAuthorizationStatusAuthorizedWhenInUse
import platform.CoreLocation.kCLAuthorizationStatusDenied
import platform.CoreLocation.kCLAuthorizationStatusNotDetermined
import platform.CoreLocation.kCLAuthorizationStatusRestricted

/**
 * iOS implementation of location permission handler using CoreLocation
 */
@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun RememberLocationPermissionState(
    context: Any,
    onPermissionGranted: () -> Unit
) {
    val locationManager = remember { CLLocationManager() }

    var authorizationStatus by remember {
        mutableStateOf(CLLocationManager.authorizationStatus())
    }

    val hasPermission = remember(authorizationStatus) {
        authorizationStatus == kCLAuthorizationStatusAuthorizedWhenInUse ||
        authorizationStatus == kCLAuthorizationStatusAuthorizedAlways
    }

    LaunchedEffect(Unit) {
        // Check current authorization status
        authorizationStatus = CLLocationManager.authorizationStatus()

        when (authorizationStatus) {
            kCLAuthorizationStatusNotDetermined -> {
                // Request permission for the first time
                locationManager.requestWhenInUseAuthorization()
            }
            kCLAuthorizationStatusAuthorizedWhenInUse,
            kCLAuthorizationStatusAuthorizedAlways -> {
                // Already authorized
                onPermissionGranted()
            }
            kCLAuthorizationStatusDenied,
            kCLAuthorizationStatusRestricted -> {
                // Permission denied or restricted
                // You might want to show a dialog explaining why location is needed
                // and directing user to Settings
            }
        }
    }

    // Monitor for permission changes
    LaunchedEffect(hasPermission) {
        if (hasPermission) {
            onPermissionGranted()
        }
    }
}


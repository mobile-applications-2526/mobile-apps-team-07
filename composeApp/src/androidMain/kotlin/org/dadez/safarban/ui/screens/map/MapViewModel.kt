package org.dadez.safarban.ui.screens.map

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

/**
 * Android implementation of LocationProvider using Google Play Services.
 */
class AndroidLocationProvider : LocationProvider {
    private var fusedClient: FusedLocationProviderClient? = null
    private var locationCallback: LocationCallback? = null
    private var onLocationUpdate: ((Any?) -> Unit)? = null

    @SuppressLint("MissingPermission")
    override fun startLocationUpdates(context: Any, onLocationUpdate: (Any?) -> Unit) {
        val androidContext = context as? Context ?: return

        // Check runtime permissions defensively
        val hasFine = ContextCompat.checkSelfPermission(
            androidContext,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            androidContext,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasFine && !hasCoarse) return
        if (locationCallback != null) return // already started

        this.onLocationUpdate = onLocationUpdate
        val appCtx = androidContext.applicationContext
        fusedClient = LocationServices.getFusedLocationProviderClient(appCtx)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                super.onLocationResult(result)
                result.lastLocation?.let { loc ->
                    onLocationUpdate(loc)
                }
            }
        }

        // Use the non-deprecated Builder API
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateIntervalMillis(2000L)
            .setMaxUpdateDelayMillis(5000L)
            .build()

        // Safe to call since we checked permissions above
        fusedClient?.requestLocationUpdates(request, locationCallback!!, Looper.getMainLooper())
    }

    override fun stopLocationUpdates() {
        locationCallback?.let { cb ->
            fusedClient?.removeLocationUpdates(cb)
        }
        locationCallback = null
        onLocationUpdate = null
    }
}

/**
 * Factory function to create Android location provider.
 */
actual fun createLocationProvider(): LocationProvider = AndroidLocationProvider()

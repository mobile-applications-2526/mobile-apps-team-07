package org.dadez.safarban.data.location

import android.annotation.SuppressLint
import android.location.Location
import android.os.Looper
import android.util.Log
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import org.dadez.safarban.domain.model.UserLocation
import kotlin.coroutines.resume

/**
 * Android implementation of [LocationProvider] using FusedLocationProviderClient.
 * Provides location updates as a Flow, automatically handling lifecycle cleanup.
 */
class LocationProviderImpl(
    private val fusedLocationClient: FusedLocationProviderClient
) : LocationProvider {

    @SuppressLint("MissingPermission")
    override fun locationUpdates(): Flow<UserLocation> = callbackFlow {
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateIntervalMillis(2000L)
            .setMaxUpdateDelayMillis(5000L)
            .setWaitForAccurateLocation(false)
            .build()

        // Try to emit last known location immediately
        try {
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location ->
                    location?.let {
                        trySend(it.toUserLocation()).isSuccess
                    }
                }
                .addOnFailureListener { ex ->
                    Log.w("LocationProvider", "Failed to get last location: ${ex.message}")
                }
        } catch (e: SecurityException) {
            Log.w("LocationProvider", "Permission missing for lastLocation: ${e.message}")
        } catch (e: Exception) {
            Log.w("LocationProvider", "Exception fetching lastLocation: ${e.message}")
        }

        // Set up continuous location updates
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    trySend(location.toUserLocation()).isSuccess
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                callback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            Log.w("LocationProvider", "Permission missing for location updates: ${e.message}")
            close(e)
        }

        awaitClose {
            try {
                fusedLocationClient.removeLocationUpdates(callback)
            } catch (e: Exception) {
                Log.w("LocationProvider", "Failed to remove location updates: ${e.message}")
            }
        }
    }

    @SuppressLint("MissingPermission")
    override suspend fun getLastKnownLocation(): UserLocation? {
        return try {
            suspendCancellableCoroutine { cont ->
                val task = fusedLocationClient.lastLocation
                task.addOnCompleteListener { t ->
                    if (t.isSuccessful) {
                        cont.resume(t.result?.toUserLocation())
                    } else {
                        cont.resume(null)
                    }
                }
                task.addOnFailureListener {
                    if (!cont.isCompleted) cont.resume(null)
                }
            }
        } catch (e: SecurityException) {
            Log.w("LocationProvider", "Permission missing: ${e.message}")
            null
        } catch (e: Exception) {
            Log.w("LocationProvider", "Failed to get last location: ${e.message}")
            null
        }
    }

    private fun Location.toUserLocation(): UserLocation {
        return UserLocation(
            latitude = latitude,
            longitude = longitude,
            accuracy = accuracy,
            timestamp = time
        )
    }
}


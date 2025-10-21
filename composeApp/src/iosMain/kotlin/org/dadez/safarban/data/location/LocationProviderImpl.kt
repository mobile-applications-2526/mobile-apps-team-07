package org.dadez.safarban.data.location

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.useContents
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.dadez.safarban.domain.model.UserLocation
import platform.CoreLocation.CLLocation
import platform.CoreLocation.CLLocationManager
import platform.CoreLocation.CLLocationManagerDelegateProtocol
import platform.CoreLocation.kCLLocationAccuracyBest
import platform.darwin.NSObject
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * iOS implementation of [LocationProvider] using CLLocationManager.
 * Provides location updates as a Flow, automatically handling lifecycle cleanup.
 */
@OptIn(ExperimentalForeignApi::class)
class LocationProviderImpl : LocationProvider {
    private val locationManager = CLLocationManager()
    private var delegate: CLLocationManagerDelegateProtocol? = null

    override fun locationUpdates(): Flow<UserLocation> = callbackFlow {
        delegate = object : NSObject(), CLLocationManagerDelegateProtocol {
            override fun locationManager(manager: CLLocationManager, didUpdateLocations: List<*>) {
                val location = didUpdateLocations.lastOrNull() as? CLLocation
                location?.let {
                    it.coordinate.useContents {
                        trySend(
                            UserLocation(
                                latitude = latitude,
                                longitude = longitude,
                                accuracy = it.horizontalAccuracy.toFloat(),
                                timestamp = it.timestamp.timeIntervalSince1970.toLong() * 1000
                            )
                        )
                    }
                }
            }

            override fun locationManager(
                manager: CLLocationManager,
                didFailWithError: platform.Foundation.NSError
            ) {
                // Log error but don't close the flow - location might recover
            }
        }

        locationManager.delegate = delegate
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.startUpdatingLocation()

        awaitClose {
            locationManager.stopUpdatingLocation()
            locationManager.delegate = null
            delegate = null
        }
    }

    override suspend fun getLastKnownLocation(): UserLocation? = suspendCoroutine { cont ->
        val location = locationManager.location
        if (location != null) {
            location.coordinate.useContents {
                cont.resume(
                    UserLocation(
                        latitude = latitude,
                        longitude = longitude,
                        accuracy = location.horizontalAccuracy.toFloat(),
                        timestamp = location.timestamp.timeIntervalSince1970.toLong() * 1000
                    )
                )
            }
        } else {
            cont.resume(null)
        }
    }
}


package org.dadez.safarban.ui.screens.map

/**
 * iOS implementation of LocationProvider.
 * TODO: Implement using CoreLocation when iOS support is added.
 */
class IosLocationProvider : LocationProvider {
    override fun startLocationUpdates(context: Any, onLocationUpdate: (Any?) -> Unit) {
        // iOS implementation pending
        // Will use CoreLocation framework
    }

    override fun stopLocationUpdates() {
        // iOS implementation pending
    }
}

/**
 * Factory function to create iOS location provider.
 */
actual fun createLocationProvider(): LocationProvider = IosLocationProvider()


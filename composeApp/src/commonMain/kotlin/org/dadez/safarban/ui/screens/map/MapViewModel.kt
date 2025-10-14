package org.dadez.safarban.ui.screens.map

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Multiplatform ViewModel for map functionality.
 * Uses platform-specific location provider to track user location.
 */
class MapViewModel : ViewModel() {
    private val _userLocation = MutableStateFlow<Any?>(null)
    val userLocation = _userLocation.asStateFlow()

    private val locationProvider: LocationProvider = createLocationProvider()

    /**
     * Starts tracking user location.
     * Platform-specific implementation provided by expect/actual.
     */
    fun startLocationUpdates(context: Any) {
        locationProvider.startLocationUpdates(context) { location ->
            _userLocation.value = location
        }
    }

    /**
     * Stops tracking user location.
     */
    fun stopLocationUpdates() {
        locationProvider.stopLocationUpdates()
    }

    override fun onCleared() {
        stopLocationUpdates()
        super.onCleared()
    }
}

/**
 * Platform-specific location provider interface.
 */
interface LocationProvider {
    fun startLocationUpdates(context: Any, onLocationUpdate: (Any?) -> Unit)
    fun stopLocationUpdates()
}

/**
 * Factory function to create platform-specific location provider.
 * Implementation provided by expect/actual pattern.
 */
expect fun createLocationProvider(): LocationProvider


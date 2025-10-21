package org.dadez.safarban.data.location

import kotlinx.coroutines.flow.Flow
import org.dadez.safarban.domain.model.UserLocation

/**
 * Common interface for platform-specific location services.
 * Provides real-time GPS location updates.
 */
interface LocationProvider {
    fun locationUpdates(): Flow<UserLocation>
    suspend fun getLastKnownLocation(): UserLocation?
}


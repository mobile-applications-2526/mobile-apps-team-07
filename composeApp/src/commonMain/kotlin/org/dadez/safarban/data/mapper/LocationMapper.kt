package org.dadez.safarban.data.mapper

import android.location.Location
import org.dadez.safarban.domain.model.UserLocation

/**
 * Maps Android Location to domain UserLocation model
 */
fun Location.toUserLocation(): UserLocation {
    return UserLocation(
        latitude = latitude,
        longitude = longitude,
        accuracy = accuracy,
        timestamp = time
    )
}


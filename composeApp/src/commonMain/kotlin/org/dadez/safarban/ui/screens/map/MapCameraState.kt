package org.dadez.safarban.ui.screens.map

/**
 * Data class to hold the camera state of the map.
 */
data class MapCameraState(
    val latitude: Double = 35.6892, // Default to Tehran
    val longitude: Double = 51.3890,
    val zoom: Double = 10.0
)


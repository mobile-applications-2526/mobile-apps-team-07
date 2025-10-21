package org.dadez.safarban.domain.model

/**
 * Domain model representing user's geographical location
 */
data class UserLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float? = null,
    val timestamp: Long = 0L
)

package org.dadez.safarban.data.mapper

/**
 * Source model representing boat information from elsewhere in the app
 * This is intentionally small and can be extended to match upstream API shapes.
 */
data class BoatInfo(
    val externalId: String,
    val name: String,
    val type: String? = null,
    val location: String? = null,
    val status: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val ownerUserId: Long? = null
)

/**
 * Helper to convert a BoatInfo into a DB record via BoatRepository.
 * Returns Unit; callers may query the DB for the inserted row if needed.
 */
suspend fun convertAndInsertBoat(boatInfo: BoatInfo, boatRepository: org.dadez.safarban.database.BoatRepository) {
    boatRepository.insertBoat(
        externalId = boatInfo.externalId,
        name = boatInfo.name,
        type = boatInfo.type,
        location = boatInfo.location,
        status = boatInfo.status,
        latitude = boatInfo.latitude,
        longitude = boatInfo.longitude,
        ownerId = boatInfo.ownerUserId
    )
}

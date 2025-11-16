package org.dadez.safarban.data.mapper

import kotlinx.datetime.Clock
import org.dadez.safarban.domain.model.Boat
import org.dadez.safarban.database.Boat as BoatEntity

fun BoatEntity.toDomain(): Boat {
    return Boat(
        id = this.id,
        externalId = this.external_id,
        name = this.name,
        type = this.type,
        location = this.location,
        status = this.status,
        latitude = this.latitude,
        longitude = this.longitude,
        ownerId = this.owner_id
    )
}

fun Boat.toEntity(): BoatEntity {
    return BoatEntity(
        id = this.id ?: 0,
        external_id = this.externalId ?: "",
        name = this.name ?: "",
        type = this.type,
        location = this.location,
        status = this.status,
        latitude = this.latitude,
        longitude = this.longitude,
        owner_id = this.ownerId,
        created_at = System.currentTimeMillis(),
        updated_at = System.currentTimeMillis()
    )
}


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
suspend fun convertAndInsertBoat(boatInfo: BoatInfo, boatRepository: org.dadez.safarban.domain.repository.BoatRepository) {
    boatRepository.insertBoat(
        Boat(
            externalId = boatInfo.externalId,
            name = boatInfo.name,
            type = boatInfo.type,
            location = boatInfo.location,
            status = boatInfo.status,
            latitude = boatInfo.latitude,
            longitude = boatInfo.longitude,
            ownerId = boatInfo.ownerUserId
        )
    )
}

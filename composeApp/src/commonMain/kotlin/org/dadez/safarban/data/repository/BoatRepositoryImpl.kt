package org.dadez.safarban.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.dadez.safarban.domain.model.Boat
import org.dadez.safarban.domain.repository.BoatRepository

/**
 * Adapter that implements the domain-level [BoatRepository] by delegating to
 * the existing SQLDelight-generated repository wrapper in `database` package.
 */
class BoatRepositoryImpl(private val dbRepo: org.dadez.safarban.database.BoatRepository) : BoatRepository {

    private fun mapDbBoatToDomain(b: org.dadez.safarban.database.Boat): Boat = Boat(
        id = b.id,
        externalId = b.external_id,
        name = b.name,
        type = b.type,
        location = b.location,
        status = b.status,
        latitude = b.latitude,
        longitude = b.longitude,
        ownerId = b.owner_id
    )

    private fun mapDomainToDbParams(boat: Boat): List<Any?> = listOf(
        boat.externalId,
        boat.name,
        boat.type,
        boat.location,
        boat.status,
        boat.latitude,
        boat.longitude,
        boat.ownerId
    )

    override suspend fun getAllBoats(): List<Boat> = withContext(Dispatchers.Default) {
        dbRepo.getAllBoats().map { mapDbBoatToDomain(it) }
    }

    override suspend fun getBoatById(id: Long): Boat? = withContext(Dispatchers.Default) {
        dbRepo.getBoatById(id)?.let { mapDbBoatToDomain(it) }
    }

    override suspend fun getBoatByExternalId(externalId: String): Boat? = withContext(Dispatchers.Default) {
        dbRepo.getBoatByExternalId(externalId)?.let { mapDbBoatToDomain(it) }
    }

    override suspend fun insertBoat(boat: Boat) = withContext(Dispatchers.Default) {
        dbRepo.insertBoat(
            externalId = boat.externalId ?: "",
            name = boat.name ?: "",
            type = boat.type,
            location = boat.location,
            status = boat.status,
            latitude = boat.latitude,
            longitude = boat.longitude,
            ownerId = boat.ownerId
        )
        Unit
    }

    override suspend fun updateBoat(boat: Boat) = withContext(Dispatchers.Default) {
        val id = boat.id ?: return@withContext
        dbRepo.updateBoat(
            id = id,
            externalId = boat.externalId ?: "",
            name = boat.name ?: "",
            type = boat.type,
            location = boat.location,
            status = boat.status,
            latitude = boat.latitude,
            longitude = boat.longitude,
            ownerId = boat.ownerId
        )
    }

    override suspend fun deleteBoatById(id: Long) = withContext(Dispatchers.Default) {
        dbRepo.deleteBoatById(id)
        Unit
    }
}

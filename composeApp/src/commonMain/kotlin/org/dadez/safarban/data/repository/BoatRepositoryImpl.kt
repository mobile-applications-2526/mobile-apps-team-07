package org.dadez.safarban.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.dadez.safarban.data.mapper.toDomain
import org.dadez.safarban.data.mapper.toEntity
import org.dadez.safarban.database.SafarbanDatabase
import org.dadez.safarban.domain.model.Boat
import org.dadez.safarban.domain.repository.BoatRepository

/**
 * Repository class for Boat database operations
 */
class BoatRepositoryImpl(private val database: SafarbanDatabase) : BoatRepository {

    private val queries = database.boatQueries

    override suspend fun getAllBoats(): List<Boat> = withContext(Dispatchers.Default) {
        queries.selectAll().executeAsList().map { it.toDomain() }
    }

    override suspend fun getBoatById(id: Long): Boat? = withContext(Dispatchers.Default) {
        queries.selectById(id).executeAsOneOrNull()?.toDomain()
    }

    override suspend fun getBoatByExternalId(externalId: String): Boat? =
        withContext(Dispatchers.Default) {
            queries.selectByExternalId(externalId).executeAsOneOrNull()?.toDomain()
        }

    override suspend fun insertBoat(boat: Boat): Unit = withContext(Dispatchers.Default) {
        queries.insert(
            external_id = boat.externalId ?: "",
            name = boat.name ?: "",
            type = boat.type,
            location = boat.location,
            status = boat.status,
            latitude = boat.latitude,
            longitude = boat.longitude,
            owner_id = boat.ownerId,
            // Don't worry about Unresolved reference 'System'., it's a false positive app is working fine.
            created_at = System.currentTimeMillis(),
            updated_at = System.currentTimeMillis()
        )
    }

    override suspend fun updateBoat(boat: Boat): Unit = withContext(Dispatchers.Default) {
        boat.toEntity().let {
            queries.update(
                id = it.id,
                external_id = it.external_id,
                name = it.name,
                type = it.type,
                location = it.location,
                status = it.status,
                latitude = it.latitude,
                longitude = it.longitude,
                owner_id = it.owner_id,
                updated_at = it.updated_at
            )
        }
    }

    override suspend fun deleteBoatById(id: Long): Unit = withContext(Dispatchers.Default) {
        queries.deleteById(id)
    }
}

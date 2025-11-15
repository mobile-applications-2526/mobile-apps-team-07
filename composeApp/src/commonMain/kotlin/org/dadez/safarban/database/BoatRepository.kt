package org.dadez.safarban.database

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock

/**
 * Repository class for Boat database operations
 */
class BoatRepository(private val database: SafarbanDatabase) {

    private val queries = database.boatQueries

    suspend fun getAllBoats(): List<Boat> = withContext(Dispatchers.Default) {
        queries.selectAll().executeAsList()
    }

    suspend fun getBoatById(id: Long): Boat? = withContext(Dispatchers.Default) {
        queries.selectById(id).executeAsOneOrNull()
    }

    suspend fun getBoatByExternalId(externalId: String): Boat? = withContext(Dispatchers.Default) {
        queries.selectByExternalId(externalId).executeAsOneOrNull()
    }

    suspend fun insertBoat(
        externalId: String,
        name: String,
        type: String?,
        location: String?,
        status: String?,
        latitude: Double?,
        longitude: Double?,
        ownerId: Long?
    ) = withContext(Dispatchers.Default) {
        val currentTime = Clock.System.now().toEpochMilliseconds()
        queries.insert(externalId, name, type, location, status, latitude, longitude, ownerId, currentTime, currentTime)
    }

    suspend fun updateBoat(
        id: Long,
        externalId: String,
        name: String,
        type: String?,
        location: String?,
        status: String?,
        latitude: Double?,
        longitude: Double?,
        ownerId: Long?
    ) = withContext(Dispatchers.Default) {
        val currentTime = Clock.System.now().toEpochMilliseconds()
        queries.update(externalId, name, type, location, status, latitude, longitude, ownerId, currentTime, id)
    }

    suspend fun deleteBoatById(id: Long) = withContext(Dispatchers.Default) {
        queries.deleteById(id)
    }

    suspend fun deleteAllBoats() = withContext(Dispatchers.Default) {
        queries.deleteAll()
    }

    suspend fun countBoats(): Long = withContext(Dispatchers.Default) {
        queries.countAll().executeAsOne()
    }
}

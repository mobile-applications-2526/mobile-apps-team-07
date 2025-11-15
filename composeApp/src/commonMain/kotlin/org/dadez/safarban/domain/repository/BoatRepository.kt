package org.dadez.safarban.domain.repository

import org.dadez.safarban.domain.model.Boat

interface BoatRepository {
    suspend fun getAllBoats(): List<Boat>
    suspend fun getBoatById(id: Long): Boat?
    suspend fun getBoatByExternalId(externalId: String): Boat?
    suspend fun insertBoat(boat: Boat)
    suspend fun updateBoat(boat: Boat)
    suspend fun deleteBoatById(id: Long)
}

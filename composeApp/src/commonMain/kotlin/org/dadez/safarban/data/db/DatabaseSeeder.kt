package org.dadez.safarban.data.db

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.dadez.safarban.data.mapper.BoatInfo
import org.dadez.safarban.data.mapper.convertAndInsertBoat
import org.dadez.safarban.domain.repository.BoatRepository

/**
 * Seed the database with the four canonical boats if the boats table is empty.
 * This is a suspend function so callers can launch it from a coroutine.
 */
suspend fun seedDefaultBoatsIfEmpty(boatRepository: BoatRepository) = withContext(Dispatchers.Default) {
    val boats = boatRepository.getAllBoats()
    if (boats.isEmpty()) {
        val default = listOf(
            BoatInfo("SS Anne", "SS Anne", type = "Cargo Ship", location = "Port 3", status = "Docked", latitude = 26.194877, longitude = 52.558594),
            BoatInfo("HMS Victory", "HMS Victory", type = "Warship", location = "Suez Canal", status = "Sailing", latitude = 25.918526, longitude = 35.507813),
            BoatInfo("Queen Mary 2", "Queen Mary 2", type = "Cruise Ship", location = "Anchored Bay", status = "Anchored", latitude = 12.254128, longitude = 47.856445),
            BoatInfo("Black Pearl", "Black Pearl", type = "Pirate Ship", location = "Near Island", status = "Missing", latitude = 43.421009, longitude = 32.783203)
        )

        default.forEach { convertAndInsertBoat(it, boatRepository) }
    }
}

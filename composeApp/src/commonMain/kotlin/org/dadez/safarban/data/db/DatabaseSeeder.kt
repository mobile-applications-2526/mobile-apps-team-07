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
    try {
        println("DatabaseSeeder: checking existing boats...")
        val boats = boatRepository.getAllBoats()
        println("DatabaseSeeder: found ${boats.size} boats in DB")
        if (boats.isEmpty()) {
            println("DatabaseSeeder: inserting default boats...")
            val default = listOf(
                BoatInfo("SS Anne", "SS Anne", type = "Cargo Ship", location = "Port 3", status = "Docked", latitude = 26.194877, longitude = 52.558594),
                BoatInfo("HMS Victory", "HMS Victory", type = "Warship", location = "Suez Canal", status = "Sailing", latitude = 25.918526, longitude = 35.507813),
                BoatInfo("Queen Mary 2", "Queen Mary 2", type = "Cruise Ship", location = "Anchored Bay", status = "Anchored", latitude = 12.254128, longitude = 47.856445),
                BoatInfo("Black Pearl", "Black Pearl", type = "Pirate Ship", location = "Near Island", status = "Missing", latitude = 43.421009, longitude = 32.783203)
            )

            default.forEachIndexed { idx, info ->
                try {
                    convertAndInsertBoat(info, boatRepository)
                    println("DatabaseSeeder: inserted boat ${info.name} (index=$idx)")
                } catch (e: Throwable) {
                    println("DatabaseSeeder: failed inserting boat ${info.name}: ${e.message}")
                }
            }

            val after = boatRepository.getAllBoats()
            println("DatabaseSeeder: after seeding, found ${after.size} boats in DB")
        } else {
            println("DatabaseSeeder: DB already contains boats; skipping seeding")
        }
    } catch (e: Throwable) {
        println("DatabaseSeeder: exception while seeding DB: ${e.message}")
        // rethrow in case callers want to observe it; but for backward compatibility we swallow after logging
    }
}

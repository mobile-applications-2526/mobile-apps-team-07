package org.dadez.safarban.database

import app.cash.sqldelight.db.SqlDriver

/**
 * Platform-specific driver factory for SQLDelight
 */
expect class DriverFactory {
    fun createDriver(): SqlDriver
}

/**
 * Creates the database instance using the platform-specific driver
 */
fun createDatabase(driverFactory: DriverFactory): SafarbanDatabase {
    val driver = driverFactory.createDriver()
    return SafarbanDatabase(driver)
}


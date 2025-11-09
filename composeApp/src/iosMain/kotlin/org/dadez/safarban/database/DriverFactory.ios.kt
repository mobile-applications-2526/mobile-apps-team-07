package org.dadez.safarban.database

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

/**
 * iOS-specific implementation of DriverFactory
 */
actual class DriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(SafarbanDatabase.Schema, "safarban.db")
    }
}


package org.dadez.safarban.di

import org.dadez.safarban.database.createDatabase
import org.dadez.safarban.database.DriverFactory
import org.koin.core.context.startKoin
import org.koin.dsl.module

val iosModule = module {
    single { DriverFactory() }
    single { createDatabase(get()) }

    // Expose SQLDelight wrapper repositories for data module wiring
    single { org.dadez.safarban.database.BoatRepository(get()) }
    single { org.dadez.safarban.database.UserRepository(get()) }
}

fun initKoinIOS() {
    startKoin {
        modules(listOf(commonModule, iosModule))
    }
}

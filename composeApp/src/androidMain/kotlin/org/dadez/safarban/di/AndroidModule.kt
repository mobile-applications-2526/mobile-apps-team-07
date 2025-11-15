package org.dadez.safarban.di

import org.dadez.safarban.database.createDatabase
import org.dadez.safarban.database.DriverFactory
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin
import org.koin.dsl.module

val androidModule = module {
    // Provide platform DriverFactory and SQLDelight database wrapper objects
    single { DriverFactory(androidContext()) }
    single { createDatabase(get()) }

    // Provide the SQLDelight wrapper repository classes (so data implementations can depend on them)
    single { org.dadez.safarban.database.BoatRepository(get()) }
    single { org.dadez.safarban.database.UserRepository(get()) }
}

fun initKoinAndroid(appContext: android.content.Context) {
    startKoin {
        androidContext(appContext)
        modules(listOf(commonModule, androidModule))
    }
}

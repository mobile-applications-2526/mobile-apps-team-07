package org.dadez.safarban.di


import org.dadez.safarban.data.location.LocationProvider
import org.dadez.safarban.data.location.LocationProviderImpl
import org.dadez.safarban.database.DriverFactory
import org.dadez.safarban.database.createDatabase
import org.koin.core.context.startKoin
import org.koin.dsl.module

val iosModule = module {
    single { DriverFactory() }
    single { createDatabase(get()) }
    single<LocationProvider> { LocationProviderImpl() }
}

fun initKoinIOS() {
    startKoin {
        modules(listOf(commonModule, iosModule))
    }
}

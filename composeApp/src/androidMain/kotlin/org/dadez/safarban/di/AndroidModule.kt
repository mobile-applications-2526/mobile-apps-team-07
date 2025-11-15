package org.dadez.safarban.di


import com.google.android.gms.location.LocationServices
import org.dadez.safarban.data.location.LocationProvider
import org.dadez.safarban.data.location.LocationProviderImpl
import org.dadez.safarban.database.DriverFactory
import org.dadez.safarban.database.createDatabase
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin
import org.koin.dsl.module

val androidModule = module {
    // Provide platform DriverFactory and SQLDelight database wrapper objects
    single { DriverFactory(androidContext()) }
    single { createDatabase(get()) }
    single<LocationProvider> {
        LocationProviderImpl(
            LocationServices.getFusedLocationProviderClient(androidContext())
        )
    }
}

fun initKoinAndroid(appContext: android.content.Context) {
    startKoin {
        androidContext(appContext)
        modules(listOf(commonModule, androidModule))
    }
}

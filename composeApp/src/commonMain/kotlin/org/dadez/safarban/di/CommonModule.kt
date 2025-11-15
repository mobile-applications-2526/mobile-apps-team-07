package org.dadez.safarban.di

/**
 * Common (platform-agnostic) DI module.
 * Binds domain interfaces to data implementations.
 */

import org.dadez.safarban.data.remote.auth.InMemoryAuthTokenProvider
import org.dadez.safarban.data.repository.BoatRepositoryImpl
import org.dadez.safarban.data.repository.UserRepositoryImpl
import org.dadez.safarban.domain.repository.BoatRepository
import org.dadez.safarban.domain.repository.UserRepository
import org.dadez.safarban.domain.usecase.DeleteBoatUseCase
import org.dadez.safarban.domain.usecase.DeleteUserUseCase
import org.dadez.safarban.domain.usecase.GetAllBoatsUseCase
import org.dadez.safarban.domain.usecase.GetAllUsersUseCase
import org.dadez.safarban.domain.usecase.GetUserByIdUseCase
import org.dadez.safarban.domain.usecase.InsertBoatUseCase
import org.dadez.safarban.domain.usecase.InsertUserUseCase
import org.dadez.safarban.domain.usecase.UpdateBoatUseCase
import org.dadez.safarban.domain.usecase.UpdateUserUseCase
import org.dadez.safarban.ui.screens.map.MapViewModel
import org.dadez.safarban.ui.screens.map.MapViewModelImpl
import org.koin.dsl.module

val commonModule = module {
    single<org.dadez.safarban.data.remote.auth.AuthTokenProvider> { InMemoryAuthTokenProvider() }

    // Domain <-> Data wiring: BoatRepository (domain) -> BoatRepositoryImpl (data)
    single<BoatRepository> {
        BoatRepositoryImpl(get())
    }

    single { GetAllBoatsUseCase(get()) }
    single { InsertBoatUseCase(get()) }
    single { UpdateBoatUseCase(get()) }
    single { DeleteBoatUseCase(get()) }

    // User wiring
    single<UserRepository> {
        UserRepositoryImpl(get())
    }

    single { GetAllUsersUseCase(get()) }
    single { GetUserByIdUseCase(get()) }
    single { InsertUserUseCase(get()) }
    single { UpdateUserUseCase(get()) }
    single { DeleteUserUseCase(get()) }

    factory<MapViewModel> {
        MapViewModelImpl(get(), get(), get())
    }
}

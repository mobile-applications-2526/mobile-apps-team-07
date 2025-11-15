package org.dadez.safarban.di

import org.dadez.safarban.data.repository.BoatRepositoryImpl
import org.dadez.safarban.data.remote.auth.InMemoryAuthTokenProvider
import org.dadez.safarban.domain.repository.BoatRepository
import org.dadez.safarban.domain.usecase.GetAllBoatsUseCase
import org.dadez.safarban.domain.usecase.InsertBoatUseCase
import org.dadez.safarban.domain.usecase.UpdateBoatUseCase
import org.dadez.safarban.domain.usecase.DeleteBoatUseCase
import org.dadez.safarban.data.repository.UserRepositoryImpl
import org.dadez.safarban.domain.usecase.GetAllUsersUseCase
import org.dadez.safarban.domain.usecase.GetUserByIdUseCase
import org.dadez.safarban.domain.usecase.InsertUserUseCase
import org.dadez.safarban.domain.usecase.UpdateUserUseCase
import org.dadez.safarban.domain.usecase.DeleteUserUseCase
import org.dadez.safarban.domain.repository.UserRepository
import org.koin.dsl.module

/**
 * Common (platform-agnostic) DI module.
 * Binds domain interfaces to data implementations.
 */
val commonModule = module {
    single<org.dadez.safarban.data.remote.auth.AuthTokenProvider> { InMemoryAuthTokenProvider() }

    // Domain <-> Data wiring: BoatRepository (domain) -> BoatRepositoryImpl (data)
    // Note: the data implementation expects the SQLDelight wrapper `org.dadez.safarban.database.BoatRepository`
    single<BoatRepository> {
        // expect platform module to have provided the SQLDelight wrapper BoatRepository as a dependency
        BoatRepositoryImpl(get())
    }

    single { GetAllBoatsUseCase(get()) }
    single { InsertBoatUseCase(get()) }
    single { UpdateBoatUseCase(get()) }
    single { DeleteBoatUseCase(get()) }

    // User wiring
    single<org.dadez.safarban.domain.repository.UserRepository> {
        UserRepositoryImpl(get())
    }

    single { GetAllUsersUseCase(get()) }
    single { GetUserByIdUseCase(get()) }
    single { InsertUserUseCase(get()) }
    single { UpdateUserUseCase(get()) }
    single { DeleteUserUseCase(get()) }
}

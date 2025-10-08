package org.dadez.safarban.di

import org.koin.dsl.module

val appModule = module {
    // Add your dependencies here as needed
    // single { SomeRepository() }
    // single { SomeUseCase(get()) }

    // Note: Navigation is now handled directly by RootComponent
    // No need for NavigationService abstraction
}

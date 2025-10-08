package org.dadez.safarban

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import org.koin.compose.KoinApplication
import com.arkivanov.decompose.extensions.compose.stack.Children
import com.arkivanov.decompose.extensions.compose.stack.animation.slide
import com.arkivanov.decompose.extensions.compose.stack.animation.stackAnimation
import com.arkivanov.decompose.extensions.compose.subscribeAsState
import org.dadez.safarban.navigation.RootComponent
import org.dadez.safarban.screens.details.DetailsScreen
import org.dadez.safarban.screens.home.HomeScreen
import org.dadez.safarban.screens.settings.SettingsScreen
import org.dadez.safarban.screens.profile.ProfileScreen
import org.dadez.safarban.di.appModule

/**
 * Main entry point for the app with Decompose navigation and Koin DI
 * Now accepts a single RootComponent instance to avoid duplicate registrations
 */
@Composable
fun RootApp(rootComponent: RootComponent) {
    KoinApplication(application = {
        modules(appModule)
    }) {
        MaterialTheme {
            val childStack by rootComponent.routerState.subscribeAsState()

            // Add smooth navigation animations
            Children(
                stack = childStack,
                animation = stackAnimation(slide())
            ) { child ->
                when (val instance = child.instance) {
                    is RootComponent.Child.HomeChild -> {
                        HomeScreen(
                            component = instance.component,
                            onOpenDetails = rootComponent::navigateToDetails,
                            onOpenSettings = rootComponent::navigateToSettings,
                            onOpenProfile = rootComponent::navigateToProfile
                        )
                    }

                    is RootComponent.Child.DetailsChild -> {
                        DetailsScreen(
                            component = instance.component,
                            onBack = { rootComponent.navigateBack() }
                        )
                    }

                    is RootComponent.Child.SettingsChild -> {
                        SettingsScreen(
                            component = instance.component,
                            onBack = { rootComponent.navigateBack() }
                        )
                    }

                    is RootComponent.Child.ProfileChild -> {
                        ProfileScreen(
                            component = instance.component,
                            onBack = { rootComponent.navigateBack() }
                        )
                    }
                }
            }
        }
    }
}

/**
 * No-arg App function for previews and testing
 */
@Composable
fun App() {
    // Create a fake ComponentContext for previews and a single RootComponent
    val fakeLifecycle = com.arkivanov.essenty.lifecycle.LifecycleRegistry()
    val fakeComponentContext = com.arkivanov.decompose.DefaultComponentContext(fakeLifecycle)
    val fakeRoot = remember { RootComponent(fakeComponentContext) }
    RootApp(fakeRoot)
}

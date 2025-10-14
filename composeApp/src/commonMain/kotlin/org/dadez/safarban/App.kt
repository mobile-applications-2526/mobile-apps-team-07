package org.dadez.safarban

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.arkivanov.decompose.extensions.compose.stack.Children
import com.arkivanov.decompose.extensions.compose.stack.animation.slide
import com.arkivanov.decompose.extensions.compose.stack.animation.stackAnimation
import com.arkivanov.decompose.extensions.compose.subscribeAsState
import org.dadez.safarban.di.appModule
import org.dadez.safarban.ui.components.general.BottomNavigationBar
import org.dadez.safarban.ui.navigation.RootComponent
import org.dadez.safarban.ui.screens.cargo.CargoScreen
import org.dadez.safarban.ui.screens.details.DetailsScreen
import org.dadez.safarban.ui.screens.home.HomeScreen
import org.dadez.safarban.ui.screens.map.MapScreen
import org.dadez.safarban.ui.screens.profile.ProfileScreen
import org.dadez.safarban.ui.screens.settings.SettingsScreen
import org.koin.compose.KoinApplication

/**
 * Main entry point for the app with Decompose navigation and Koin DI
 * Now accepts a single RootComponent instance to avoid duplicate registrations
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RootApp(rootComponent: RootComponent) {
    KoinApplication(application = {
        modules(appModule)
    }) {
        MaterialTheme {
            val childStack by rootComponent.routerState.subscribeAsState()
            val currentConfig = childStack.active.configuration

            Scaffold(
                bottomBar = {
                    BottomNavigationBar(
                        currentRoute = currentConfig as RootComponent.Config,
                        onNavigateToHome = rootComponent::navigateToHome,
                        onNavigateToMap = rootComponent::navigateToMap,
                        onNavigateToCargo = rootComponent::navigateToCargo,
                        onNavigateToProfile = { rootComponent.navigateToProfile("current_user") }
                    )
                }
            ) { paddingValues ->
                // Add smooth navigation animations
                Children(
                    stack = childStack,
                    animation = stackAnimation(slide()),
                    modifier = Modifier.padding(paddingValues)
                ) { child ->
                    when (val instance = child.instance) {
                        is RootComponent.Child.HomeChild -> {
                            HomeScreen(
                                component = instance.component,
                                onOpenDetails = rootComponent::navigateToDetails,
                                onOpenSettings = rootComponent::navigateToSettings,
                                onOpenProfile = { rootComponent.navigateToProfile("current_user") }
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

                        is RootComponent.Child.MapChild -> {
                            MapScreen(
                                component = instance.component,
                                onBack = { rootComponent.navigateBack() }
                            )
                        }

                        is RootComponent.Child.CargoChild -> {
                            CargoScreen(
                                component = instance.component,
                                onBack = { rootComponent.navigateBack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
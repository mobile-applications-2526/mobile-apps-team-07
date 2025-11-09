package org.dadez.safarban

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.arkivanov.decompose.extensions.compose.stack.Children
import com.arkivanov.decompose.extensions.compose.subscribeAsState
import org.dadez.safarban.ui.components.general.BottomNavigationBar
import org.dadez.safarban.ui.navigation.RootComponent
import org.dadez.safarban.ui.screens.cargo.CargoScreen
import org.dadez.safarban.ui.screens.details.DetailsScreen
import org.dadez.safarban.ui.screens.home.HomeScreen
import org.dadez.safarban.ui.screens.map.MapScreen
import org.dadez.safarban.ui.screens.profile.ProfileScreen
import org.dadez.safarban.ui.screens.settings.SettingsScreen

/**
 * Main entry point for the app with Decompose navigation
 * Now accepts a single RootComponent instance to avoid duplicate registrations
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RootApp(rootComponent: RootComponent) {
    MaterialTheme {
        val childStack by rootComponent.routerState.subscribeAsState()
        val currentConfig = childStack.active.configuration as RootComponent.Config

        Scaffold(
            bottomBar = {
                // Get boat component if we're in boat view for tab state
                val boatComponent = (childStack.active.instance as? RootComponent.Child.BoatChild)?.component

                BottomNavigationBar(
                    currentRoute = currentConfig,
                    onNavigateToHome = rootComponent::navigateToHome,
                    onNavigateToMap = rootComponent::navigateToMap,
                    onNavigateToProfile = { rootComponent.navigateToProfile("current_user") },
                    boatComponent = boatComponent
                )
            }
        ) { paddingValues ->
            // If we're displaying a Boat screen, don't apply the scaffold padding so the map can draw full-bleed
            val childrenModifier = if (currentConfig is RootComponent.Config.Boat) Modifier else Modifier.padding(paddingValues)

            // Render children without animations
            Children(
                stack = childStack,
                modifier = childrenModifier
            ) { child ->
                when (val instance = child.instance) {
                    is RootComponent.Child.HomeChild -> {
                        HomeScreen(
                            component = instance.component,
                            onOpenDetails = rootComponent::navigateToDetails,
                            onOpenSettings = rootComponent::navigateToSettings,
                            onOpenProfile = { rootComponent.navigateToProfile("current_user") },
                            onBoatClick = rootComponent::navigateToBoat
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

                    is RootComponent.Child.BoatChild -> {
                        org.dadez.safarban.ui.screens.boat.BoatScreen(
                            component = instance.component,
                            onBack = { rootComponent.navigateBack() }
                        )
                    }
                }
            }
        }
    }
}

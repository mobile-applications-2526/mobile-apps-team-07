package org.dadez.safarban

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
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
fun RootApp(
    rootComponent: RootComponent,
    // Platform can pass responsive heights; if null we'll fall back to sane defaults used by MapScreen
    maxSheetHeight: Dp? = null,
    minSheetHeight: Dp? = null,
    initialSheetHeight: Dp? = null
) {
    MaterialTheme {
        val childStack by rootComponent.routerState.subscribeAsState()
        val currentConfig = childStack.active.configuration as RootComponent.Config

        Scaffold(
            bottomBar = {
                // Hide bottom navigation only on the Map screen; show it on Boat and other screens
                if (currentConfig !is RootComponent.Config.Map) {
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
            }
        ) { paddingValues ->
            // If we're displaying a Boat screen, don't apply the scaffold padding so the map can draw full-bleed
            if (currentConfig is RootComponent.Config.Boat) {
                // no scaffold padding when showing Boat to allow full-bleed map
            }

            when (val child = childStack.active.instance) {
                is RootComponent.Child.HomeChild -> {
                    HomeScreen(
                        component = child.component,
                        onOpenDetails = rootComponent::navigateToDetails,
                        onOpenSettings = rootComponent::navigateToSettings,
                        onOpenProfile = { rootComponent.navigateToProfile("current_user") },
                        onBoatClick = rootComponent::navigateToBoat
                    )
                }

                is RootComponent.Child.DetailsChild -> {
                    DetailsScreen(
                        component = child.component,
                        onBack = { rootComponent.navigateBack() }
                    )
                }

                is RootComponent.Child.SettingsChild -> {
                    SettingsScreen(
                        component = child.component,
                        onBack = { rootComponent.navigateBack() }
                    )
                }

                is RootComponent.Child.ProfileChild -> {
                    ProfileScreen(
                        component = child.component,
                        onBack = { rootComponent.navigateBack() }
                    )
                }

                is RootComponent.Child.MapChild -> {
                    // Forward platform-provided sizes or use MapScreen defaults when null
                    MapScreen(
                        component = child.component,
                        onBack = { rootComponent.navigateBack() },
                        onBoatClick = { boatId, boatName ->
                            rootComponent.navigateToBoat(boatId, boatName)
                        },
                        maxSheetHeight = maxSheetHeight ?: 320.dp,
                        minSheetHeight = minSheetHeight ?: 80.dp,
                        // forward nullable initial so BottomSheet may compute collapsed height from measured card
                        initialSheetHeight = initialSheetHeight
                    )
                }

                is RootComponent.Child.CargoChild -> {
                    CargoScreen(
                        component = child.component,
                        onBack = { rootComponent.navigateBack() }
                    )
                }

                is RootComponent.Child.BoatChild -> {
                    org.dadez.safarban.ui.screens.boat.BoatScreen(
                        component = child.component,
                        onBack = { rootComponent.navigateBack() }
                    )
                }
            }
        }
    }
}

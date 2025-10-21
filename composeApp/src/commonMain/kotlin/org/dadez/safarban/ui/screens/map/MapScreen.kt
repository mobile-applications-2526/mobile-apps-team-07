package org.dadez.safarban.ui.screens.map

import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.dadez.safarban.data.location.RememberLocationPermissionState
import org.dadez.safarban.domain.model.UserLocation
import org.dadez.safarban.ui.components.maps.LocationItem

/**
 * Get platform-specific context.
 * Android: returns Android Context
 * iOS: returns platform-specific context object
 */
@Composable
expect fun rememberPlatformContext(): Any

/**
 * Get platform-specific LocationProvider implementation
 */
@Composable
expect fun rememberLocationProvider(): org.dadez.safarban.data.location.LocationProvider

@Composable
fun MapScreen(
    component: MapComponent,
    onBack: () -> Unit
) {
    val context = rememberPlatformContext()
    val recenter = remember { mutableStateOf(false) }
    var userLocation by remember { mutableStateOf<UserLocation?>(null) }

    // Create location provider
    val locationProvider = rememberLocationProvider()
    var isLocationPermissionGranted by remember { mutableStateOf(false) }

    // Remember camera state across configuration changes and process death
    var mapCameraState by remember { mutableStateOf(MapCameraState()) }

    // Handle location permissions
    RememberLocationPermissionState(
        context = context,
        onPermissionGranted = {
            isLocationPermissionGranted = true
        }
    )

    // Start collecting location updates when permission is granted
    LaunchedEffect(isLocationPermissionGranted) {
        if (isLocationPermissionGranted) {
            locationProvider.locationUpdates().collect { location ->
                userLocation = location
            }
        }
    }


    // Custom Saver for Dp type
    val DpSaver = Saver<Dp, Float>(
        save = { it.value },
        restore = { it.dp }
    )

    // Bottom sheet state with custom Saver
    var bottomSheetHeight by rememberSaveable(stateSaver = DpSaver) {
        mutableStateOf(160.dp)
    }
    val listState = rememberLazyListState()
    var shouldAnimateRefresh by rememberSaveable { mutableStateOf(false) }

    // Dummy data for nearby places
    val dummyLocations = remember {
        listOf(
            LocationItem("SS Anne", "Cargo Ship", description = "Docked at Port 3", 26.194877, 52.558594), // Gulf
            LocationItem("HMS Victory", "Warship", description = "Sailing nearby", 25.918526, 35.507813), // Egypt suez
            LocationItem("Queen Mary 2", "Cruise Ship", description = "Anchored at Bay", 12.254128, 47.856445), // Houthi ship
            LocationItem("Black Pearl", "Pirate Ship", description = "Last seen near the island", 43.421009, 32.783203) // Stuck in the black sea
        )
    }

    // Use separated MapContent composable
    MapContent(
        userLocation = userLocation,
        initialCameraState = mapCameraState,
        recenter = recenter,
        bottomSheetHeight = bottomSheetHeight,
        onBottomSheetHeightChanged = { height -> bottomSheetHeight = height },
        listState = listState,
        locations = dummyLocations,
        shouldAnimateRefresh = shouldAnimateRefresh,
        onRefresh = { shouldAnimateRefresh = true },
        onRefreshAnimationComplete = { shouldAnimateRefresh = false },
        onLocationClick = { location ->
            // Handle location click
        },
        onCameraMove = { lat, lon, zoom ->
            // Save camera state when user moves the map
            mapCameraState = MapCameraState(lat, lon, zoom)
        }
    )
}

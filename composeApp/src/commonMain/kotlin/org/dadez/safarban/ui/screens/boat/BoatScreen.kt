package org.dadez.safarban.ui.screens.boat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.ChevronLeft
import com.composables.icons.lucide.Lucide
import org.dadez.safarban.ui.components.maps.LocationItem
import org.dadez.safarban.ui.screens.map.MapCameraState
import org.dadez.safarban.ui.screens.map.MapContent
import androidx.compose.foundation.lazy.rememberLazyListState

// Ocean blue color - same as HomeScreen
private val OceanBlue = Color(0xFF006994)

// Height of the bottom navigation bar used across the app
private val BottomNavHeight = 56.dp

// Sheet styling for overview: white background with blue accent border
private val OverviewSheetBackground = Color.White
private val OverviewSheetContent = Color(0xFF1D2124)
private val OverviewCardBackground = Color.White
private val OverviewCardContent = Color(0xFF1D2124)
private val OverviewAccentBlue = Color(0xFF006994)

/**
 * Boat detail screen showing boat name and selected tab content
 */
@Composable
fun BoatScreen(
    component: BoatComponent,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by component.state.collectAsState()

    Box(modifier = modifier.fillMaxSize()) {
        // Map content placed first so overlays (top bar and bottom nav) render on top
        when (state.selectedTab) {
            BoatTab.OVERVIEW -> OverviewMapArea(state)
            else -> {
                // For non-map tabs, show content normally
                Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    when (state.selectedTab) {
                        BoatTab.OPERATIONS -> OperationsTabContent(state)
                        BoatTab.SPECIFICATIONS -> SpecificationsTabContent(state)
                        else -> {}
                    }
                }
            }
        }

        // Top bar overlays map
        TopBar(
            boatName = state.boatName,
            selectedTab = state.selectedTab,
            onBack = onBack,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
private fun TopBar(
    boatName: String,
    selectedTab: BoatTab,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(OceanBlue)
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(horizontal = 12.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Lucide.ChevronLeft,
            contentDescription = "Back",
            tint = Color.White,
            modifier = Modifier
                .size(28.dp)
                .clickable { onBack() }
        )

        Spacer(modifier = Modifier.weight(1f))

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.align(Alignment.CenterVertically)
        ) {
            Text(
                text = boatName,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White
            )

            Text(
                text = when (selectedTab) {
                    BoatTab.OVERVIEW -> "Overview"
                    BoatTab.OPERATIONS -> "Operations"
                    BoatTab.SPECIFICATIONS -> "Specifications"
                },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        Box(modifier = Modifier.size(28.dp))
    }
}

@Composable
private fun OverviewMapArea(state: BoatUiState) {
    // Use coordinates from state when present, otherwise fall back to defaults
    val boatLat = state.boatLatitude ?: 35.6892
    val boatLon = state.boatLongitude ?: 51.3890

    // Create locations: when viewing a specific boat overview, show only that boat on the map
    val defaultLocations = listOf(
        LocationItem("SS Anne", "Cargo Ship", description = "Docked at Port 3", 26.194877, 52.558594),
        LocationItem("HMS Victory", "Warship", description = "Sailing nearby", 25.918526, 35.507813),
        LocationItem("Queen Mary 2", "Cruise Ship", description = "Anchored at Bay", 12.254128, 47.856445),
        LocationItem("Black Pearl", "Pirate Ship", description = "Last seen near the island", 43.421009, 32.783203)
    )

    // Prefer explicit coords from state. If not present, try to find the selected boat by id or name in defaults
    val matchedDefault = defaultLocations.find {
        (it.id.equals(state.boatId, ignoreCase = true) && state.boatId.isNotBlank()) ||
        (it.name.equals(state.boatName, ignoreCase = true) && state.boatName.isNotBlank())
    }

    val locations = when {
        state.boatLatitude != null && state.boatLongitude != null -> listOf(
            LocationItem(
                id = state.boatId.ifEmpty { "boat_unknown" },
                name = state.boatName.ifEmpty { "Unknown Boat" },
                description = "",
                latitude = state.boatLatitude,
                longitude = state.boatLongitude
            )
        )
        matchedDefault != null -> listOf(matchedDefault)
        else -> defaultLocations
    }

    // Camera state: prefer explicit coords, else matched default, else fall back to boatLat/boatLon (or provided defaults)
    val cameraLat = state.boatLatitude ?: matchedDefault?.latitude ?: boatLat
    val cameraLon = state.boatLongitude ?: matchedDefault?.longitude ?: boatLon

    // Use the reference image debug values to compute an appropriate camera center relative to the boat.
    // These come from the debug card shown in your screenshot and produce a pleasing initial framing:
    // Image debug values: center (23.214798, 35.525475), zoom 8.515645904181694, boat @ (25.918526, 35.507813)
    // From that we derive offsets relative to the boat: baseVerticalDiff = centerLat - boatLat = -2.703728
    // and lonOffset = centerLon - boatLon = 0.017662
    val baseVerticalDiff = -2.703728
    val imageLonOffset = 0.017662
    val overviewZoom = 8.515645904181694

    // Increase vertical shift slightly so the boat isn't obscured by the bottom sheet by default.
    // Multiply the base vertical diff by a small factor (>1 moves the camera further south, raising the boat on screen).
    val extraVerticalFactor = 1.8 // tweak this to adjust how much higher the boat appears
    val adjustedVerticalDiff = baseVerticalDiff * extraVerticalFactor

    // If we have a single selected boat (overview), compute the camera center from that boat so this works for any boat coords
    val overviewCenterLat: Double
    val overviewCenterLon: Double
    val singleBoat = locations.firstOrNull()
    if (singleBoat != null) {
        overviewCenterLat = singleBoat.latitude + adjustedVerticalDiff
        overviewCenterLon = singleBoat.longitude + imageLonOffset
    } else {
        // Fallback to a reasonable target based on cameraLat/cameraLon
        overviewCenterLat = cameraLat + adjustedVerticalDiff
        overviewCenterLon = cameraLon + imageLonOffset
    }

    val initialCameraState = MapCameraState(latitude = overviewCenterLat, longitude = overviewCenterLon, zoom = overviewZoom)

    // Recenter state - MapContent will call onRecenterComplete to reset this
    val recenter = remember { mutableStateOf(true) }

    // Bottom sheet size and list state
    val DpSaver = androidx.compose.runtime.saveable.Saver<Dp, Float>(
        save = { it.value },
        restore = { it.dp }
    )

    var bottomSheetHeight by rememberSaveable(stateSaver = DpSaver) { mutableStateOf(200.dp) }
    val listState = rememberLazyListState()

    // When opening the overview tab, ensure the map recenters on the boat
    LaunchedEffect(state.boatId) {
        recenter.value = true
    }

    // Render map + bottom sheet and pass bottomPadding so the sheet/FAB sit above bottom nav
    MapContent(
        userLocation = null,
        initialCameraState = initialCameraState,
        recenter = recenter,
        bottomSheetHeight = bottomSheetHeight,
        onBottomSheetHeightChanged = { bottomSheetHeight = it },
        listState = listState,
        locations = locations,
        shouldAnimateRefresh = false,
        onRefresh = {},
        onRefreshAnimationComplete = {},
        onLocationClick = { /* TODO: navigate to location details */ },
        onCameraMove = { _, _, _ -> },
        // Explicitly pass the chosen overview camera center so platform maps will honor it
        selectedCameraLat = overviewCenterLat,
        selectedCameraLon = overviewCenterLon,
        bottomPadding = BottomNavHeight,
        showFab = false,
        sheetContainerColor = OverviewSheetBackground,
        sheetContentColor = OverviewSheetContent,
        cardBackgroundColor = OverviewCardBackground,
        cardContentColor = OverviewCardContent,
        cardBorderColor = OverviewAccentBlue,
        cardBorderWidth = 2.dp,
        isOverview = true // Render the simplified overview cells (handle + paired cells)
    )
}

@Composable
private fun OperationsTabContent(state: BoatUiState) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "This is the operations tab for ${state.boatName}. Here you would see operational data, schedules, and activities.",
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun SpecificationsTabContent(state: BoatUiState) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "This is the specifications tab for ${state.boatName}. Here you would see technical specifications and details.",
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

package org.dadez.safarban.ui.screens.map

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.Compass
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.UserRound
import org.dadez.safarban.domain.model.UserLocation
import org.dadez.safarban.ui.components.maps.BottomSheet
import org.dadez.safarban.ui.components.maps.LocationItem

/**
 * Expect function for platform-specific map implementation
 */
@Composable
expect fun OpenStreetMap(
    modifier: Modifier = Modifier,
    userLocation: UserLocation? = null,
    boatLocations: List<LocationItem> = emptyList(),
    // Optional selection filters — platform map impls can use these to show only selected boat
    selectedBoatId: String? = null,
    selectedBoatName: String? = null,
    // Optional explicit camera center override (latitude/longitude) to force the map center
    selectedCameraLat: Double? = null,
    selectedCameraLon: Double? = null,
    initialCameraState: MapCameraState,
    recenter: MutableState<Boolean>,
    onRecenterComplete: () -> Unit,
    onCameraMove: (latitude: Double, longitude: Double, zoom: Double) -> Unit,
    // Explicit: whether the map should display a user location marker and process user location
    showUserLocation: Boolean = true
)

/**
 * Map content composable that displays the map view, recenter button, and bottom sheet.
 * This separates UI concerns from the MapScreen following MVVM architecture.
 */
@Composable
fun MapContent(
    modifier: Modifier = Modifier,
    userLocation: UserLocation?,
    initialCameraState: MapCameraState,
    recenter: MutableState<Boolean>,
    bottomSheetHeight: Dp,
    onBottomSheetHeightChanged: (Dp) -> Unit,
    listState: LazyListState,
    locations: List<LocationItem>,
    shouldAnimateRefresh: Boolean,
    onRefresh: () -> Unit,
    onRefreshAnimationComplete: () -> Unit,
    onLocationClick: (LocationItem) -> Unit,
    onCameraMove: (latitude: Double, longitude: Double, zoom: Double) -> Unit,
    // Optional selected boat identification (when viewing a single boat overview)
    selectedBoatId: String? = null,
    selectedBoatName: String? = null,
    // Optional explicit camera center override (latitude/longitude)
    selectedCameraLat: Double? = null,
    selectedCameraLon: Double? = null,
    bottomPadding: Dp = 0.dp, // space at bottom (e.g., height of overlaid bottom nav)
    // New options
    showFab: Boolean = true,
    // Styling overrides forwarded to BottomSheet
    sheetContainerColor: Color = Color(0xFF1D2124),
    sheetContentColor: Color = Color.White,
    cardBackgroundColor: Color = Color(0xFF2A2D32),
    cardContentColor: Color = Color(0xFFBDBDBD),
    cardBorderColor: Color = Color.Transparent,
    cardBorderWidth: Dp = 0.dp,
    // New: indicate this content is for the overview sheet
    isOverview: Boolean = false,
    // Should the map show and track the user's location? Default true for MapScreen; BoatScreen will set false.
    showUserLocation: Boolean = true,
    // New: allow platform to pass explicit sheet height bounds
    maxSheetHeight: Dp? = null,
    minSheetHeight: Dp? = null,
    initialSheetHeight: Dp? = null
) {
    // Local camera state for on-screen debug overlay
    val cameraLatState = remember { androidx.compose.runtime.mutableStateOf(initialCameraState.latitude) }
    val cameraLonState = remember { androidx.compose.runtime.mutableStateOf(initialCameraState.longitude) }
    val cameraZoomState = remember { androidx.compose.runtime.mutableStateOf(initialCameraState.zoom) }

    // Helper to compute boat marker info (first location when available)
    val boatMarker = remember(locations) { locations.firstOrNull() }

    Box(modifier = modifier.fillMaxSize()) {
        // Map covering entire screen with user location tracking and boat markers
        OpenStreetMap(
            modifier = Modifier.fillMaxSize(),
            userLocation = userLocation,
            boatLocations = locations,
            selectedBoatId = selectedBoatId,
            selectedBoatName = selectedBoatName,
            selectedCameraLat = selectedCameraLat,
            selectedCameraLon = selectedCameraLon,
            initialCameraState = initialCameraState,
            recenter = recenter,
            onRecenterComplete = { recenter.value = false },
            onCameraMove = { lat, lon, zoom ->
                // update local debug state and forward the event
                cameraLatState.value = lat
                cameraLonState.value = lon
                cameraZoomState.value = zoom
                onCameraMove(lat, lon, zoom)
            },
            showUserLocation = showUserLocation
        )

        // Floating Action Button and User Icon Column (optional)
        if (showFab) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 16.dp, bottom = bottomSheetHeight + 16.dp + bottomPadding),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {

                FloatingActionButton(
                    onClick = { recenter.value = true },
                    containerColor = sheetContainerColor,
                    contentColor = sheetContentColor,
                    shape = RoundedCornerShape(32.dp),
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(bottom = 12.dp)
                        .size(40.dp)
                ) {
                    Icon(
                        imageVector = Lucide.Compass,
                        contentDescription = "Center on User Location",
                        modifier = Modifier.size(24.dp)
                    )
                }

                FloatingActionButton(
                    onClick = { /* TODO: handle profile click */ },
                    containerColor = sheetContainerColor,
                    contentColor = sheetContentColor,
                    shape = RoundedCornerShape(32.dp),
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(bottom = 12.dp)
                        .size(40.dp)
                ) {
                    Icon(
                        imageVector = Lucide.UserRound,
                        contentDescription = "Profile",
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        // Bottom sheet with nearby places; ensure it sits above any overlaid bottom nav
        BottomSheet(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(bottom = bottomPadding),
            locations = locations,
            userLat = userLocation?.latitude,
            userLon = userLocation?.longitude,
            onHeightChanged = onBottomSheetHeightChanged,
            onLocationClick = onLocationClick,
            isLoading = false,
            shouldAnimateRefresh = shouldAnimateRefresh,
            onRefresh = onRefresh,
            onRefreshAnimationComplete = onRefreshAnimationComplete,
            listState = listState,
            // forward debug values so the sheet can render them at the top
            debugCameraLat = null,
            debugCameraLon = null,
            debugZoom = null,
            debugBoatName = null,
            debugBoatLat = null,
            debugBoatLon = null,
            debugVerticalDeg = null,
            // forward styling
            containerColor = sheetContainerColor,
            contentColor = sheetContentColor,
            cardBackgroundColor = cardBackgroundColor,
            cardContentColor = cardContentColor,
            cardBorderColor = cardBorderColor,
            cardBorderWidth = cardBorderWidth,
            // forward overview flag
            isOverview = isOverview,
            // forward explicit bounds
            maxHeight = maxSheetHeight,
            minHeight = minSheetHeight,
            initialHeight = initialSheetHeight
        )
    }
}

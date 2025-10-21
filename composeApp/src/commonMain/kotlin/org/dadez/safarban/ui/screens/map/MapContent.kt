package org.dadez.safarban.ui.screens.map

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.Compass
import com.composables.icons.lucide.Lucide
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
    initialCameraState: MapCameraState,
    recenter: MutableState<Boolean>,
    onRecenterComplete: () -> Unit,
    onCameraMove: (latitude: Double, longitude: Double, zoom: Double) -> Unit
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
    onCameraMove: (latitude: Double, longitude: Double, zoom: Double) -> Unit
) {
    Box(modifier = modifier.fillMaxSize()) {
        // Map covering entire screen with user location tracking and boat markers
        OpenStreetMap(
            modifier = Modifier.fillMaxSize(),
            userLocation = userLocation,
            boatLocations = locations,
            initialCameraState = initialCameraState,
            recenter = recenter,
            onRecenterComplete = { recenter.value = false },
            onCameraMove = onCameraMove
        )

        // Floating Action Button to center on user location
        FloatingActionButton(
            onClick = { recenter.value = true },
            containerColor = Color(0xFF1D2124),
            contentColor = Color(0xFFBDBDBD),
            shape = RoundedCornerShape(32.dp),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = bottomSheetHeight + 16.dp)
        ) {
            Icon(
                imageVector = Lucide.Compass,
                contentDescription = "Center on User Location",
                modifier = Modifier.size(28.dp),
                tint = Color(0xFFBDBDBD)
            )
        }

        // Bottom sheet with nearby places
        BottomSheet(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter),
            locations = locations,
            userLat = userLocation?.latitude,
            userLon = userLocation?.longitude,
            onHeightChanged = onBottomSheetHeightChanged,
            onLocationClick = onLocationClick,
            isLoading = false,
            shouldAnimateRefresh = shouldAnimateRefresh,
            onRefresh = onRefresh,
            onRefreshAnimationComplete = onRefreshAnimationComplete,
            listState = listState
        )
    }
}

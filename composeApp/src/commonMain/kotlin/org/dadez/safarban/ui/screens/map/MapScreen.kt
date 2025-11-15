package org.dadez.safarban.ui.screens.map

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Search
import org.dadez.safarban.data.location.RememberLocationPermissionState
import org.dadez.safarban.rememberLocationProvider
import org.dadez.safarban.rememberPlatformContext

@Composable
fun MapScreen(
    component: MapComponent,
    onBack: () -> Unit,
    onBoatClick: (String, String) -> Unit // <-- add this
) {
    val viewModel = component
    val context = rememberPlatformContext()
    val recenter = remember { mutableStateOf(false) }
    val uiState by viewModel.uiState.collectAsState()

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
                viewModel.updateUserLocation(location)
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

    // Kick off load when component is available
    LaunchedEffect(Unit) {
        viewModel.load()
    }

    // Use separated MapContent composable inside a Box so we can overlay UI (search bar)
    Box(modifier = Modifier.fillMaxSize()) {
        MapContent(
            userLocation = uiState.userLocation,
            initialCameraState = mapCameraState,
            recenter = recenter,
            bottomSheetHeight = bottomSheetHeight,
            onBottomSheetHeightChanged = { height -> bottomSheetHeight = height },
            listState = listState,
            locations = uiState.locations,
            shouldAnimateRefresh = shouldAnimateRefresh,
            onRefresh = { shouldAnimateRefresh = true },
            onRefreshAnimationComplete = { shouldAnimateRefresh = false },
            onLocationClick = { location ->
                onBoatClick(location.id, location.name)
            },
            onCameraMove = { lat, lon, zoom ->
                // Save camera state when user moves the map
                mapCameraState = MapCameraState(lat, lon, zoom)
            },
            // Use blue-accented overview style for the map screen bottom sheet
            sheetContainerColor = Color.White,
            sheetContentColor = Color(0xFF1D2124),
            cardBackgroundColor = Color.White,
            cardContentColor = Color(0xFF1D2124),
            cardBorderColor = Color(0xFF006994),
            cardBorderWidth = 2.dp,
            isOverview = false,
            // Map screen should show the user location
            showUserLocation = true,
        )

        // Floating search bar near the top (UI-only, no logic yet)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 64.dp, end = 64.dp, top = 64.dp)
                .height(48.dp)
                .align(Alignment.TopCenter),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            // Simple placeholder content
            Icon(
                imageVector = Lucide.Search,
                contentDescription = "Search Icon",
                tint = Color(0xFF888888),
                modifier = Modifier
                    .padding(start = 12.dp, top = 12.dp)
            )
        }
    }
}

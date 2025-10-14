package org.dadez.safarban.ui.screens.map

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.composables.icons.lucide.Compass
import com.composables.icons.lucide.Lucide
import org.dadez.safarban.ui.components.maps.BottomSheet
import org.dadez.safarban.ui.components.maps.LocationItem

/**
 * Get platform-specific context.
 * Android: returns Android Context
 * iOS: returns platform-specific context object
 */
@Composable
expect fun rememberPlatformContext(): Any

/**
 * Extract latitude from platform-specific location object.
 */
expect fun getLatitude(location: Any?): Double?

/**
 * Extract longitude from platform-specific location object.
 */
expect fun getLongitude(location: Any?): Double?

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    component: MapComponent,
    onBack: () -> Unit
) {
    val uiState by component.uiState.collectAsState()
    val context = rememberPlatformContext()
    val mapViewModel = viewModel<MapViewModel>()
    val userLocation by mapViewModel.userLocation.collectAsState()
    val recenter = remember { mutableStateOf(false) }

    var hasLocationPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context as android.content.Context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
        onResult = { perms ->
            val permissionGranted = perms[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                perms[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            hasLocationPermission = permissionGranted
        }
    )

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
        // List of nearby ships
        listOf(
            LocationItem("SS Anne", "Cargo Ship", description = "Docked at Port 3", -6.200000, 106.816666),
            LocationItem("HMS Victory", "Warship", description = "Sailing nearby", -6.210000, 106.826666),
            LocationItem("Queen Mary 2", "Cruise Ship", description = "Anchored at Bay" , -6.220000, 106.806666),
            LocationItem("Black Pearl", "Pirate Ship", description = "Last seen near the island", -6.230000, 106.836666),
        )
    }

    // Request permission and start location updates
    LaunchedEffect(hasLocationPermission) {
        if (hasLocationPermission) {
            mapViewModel.startLocationUpdates(context)
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            mapViewModel.stopLocationUpdates()
        }
    }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // Map covering entire screen with user location tracking
        OpenStreetMap(
            modifier = Modifier.fillMaxSize(),
            userLocation = userLocation,
            zoom = 15.0,
            recenter = recenter,
            onRecenterComplete = { recenter.value = false }
        )

//        // Top app bar overlay
//        CenterAlignedTopAppBar(
//            title = { Text(uiState.title) },
//            navigationIcon = {
//                IconButton(onClick = onBack) {
//                    Text("←")
//                }
//            },
//            colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
//                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
//            )
//        )

        // Floating Action Button to center on user location
        FloatingActionButton(
            onClick = {
                recenter.value = true
            },
            containerColor = Color(0xFF1D2124),
            contentColor = Color(0xFFBDBDBD),
            shape = RoundedCornerShape(32.dp),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = bottomSheetHeight + 16.dp)
        ) {
            // Using a text-based icon for the location FAB
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
            locations = dummyLocations,
            userLat = getLatitude(userLocation),
            userLon = getLongitude(userLocation),
            onHeightChanged = { height -> bottomSheetHeight = height },
            onLocationClick = { location ->
                // Handle location click - could navigate to detail screen
            },
            isLoading = false,
            shouldAnimateRefresh = shouldAnimateRefresh,
            onRefresh = {
                shouldAnimateRefresh = true
            },
            onRefreshAnimationComplete = {
                shouldAnimateRefresh = false
            },
            listState = listState
        )
    }
}

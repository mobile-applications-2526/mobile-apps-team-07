package org.dadez.safarban.ui.screens.boat.screens.overview

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.BottomSheetScaffold
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SheetValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberBottomSheetScaffoldState
import androidx.compose.material3.rememberStandardBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.dadez.safarban.ui.screens.map.MapCameraState
import org.dadez.safarban.ui.screens.map.MapContent

private val OceanBlue = Color(0xFF006994)
private val BottomNavHeight = 56.dp
private val TopBarHeight = 120.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OverviewScreen(
    viewModel: OverviewViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val boat = uiState.boat

    if (boat == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = OceanBlue)
        }
        return
    }

    val recenter = remember { mutableStateOf(false) }
    val mapCameraState = remember {
        mutableStateOf(
            MapCameraState(
                latitude = boat.latitude ?: 0.0,
                longitude = boat.longitude ?: 0.0,
                zoom = 15.0
            )
        )
    }

    val bottomSheetState = rememberStandardBottomSheetState(
        initialValue = SheetValue.PartiallyExpanded,
        skipHiddenState = true
    )
    val scaffoldState = rememberBottomSheetScaffoldState(bottomSheetState = bottomSheetState)

    BottomSheetScaffold(
        scaffoldState = scaffoldState,
        sheetPeekHeight = 380.dp,
        sheetContainerColor = Color.White.copy(alpha = 0.95f),
        sheetContent = {
            // Combined bottom sheet content with grid cells and boat information
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
                    .padding(bottom = BottomNavHeight)
            ) {
                // Grid cells section (from OverviewMapArea)
                OverviewMapArea(boat = boat)

                Spacer(modifier = Modifier.height(16.dp))

                // Boat information section
                InfoCard("Boat Information") {
                    InfoRow("Name", boat.name ?: "N/A")
                    InfoRow("Type", boat.type ?: "N/A")
                    InfoRow("Status", boat.status ?: "N/A")
                    InfoRow("Location", boat.location ?: "N/A")
                }

                Spacer(modifier = Modifier.height(16.dp))

                InfoCard("Coordinates") {
                    InfoRow("Latitude", boat.latitude?.toString() ?: "N/A")
                    InfoRow("Longitude", boat.longitude?.toString() ?: "N/A")
                }

                Spacer(modifier = Modifier.height(16.dp))

                InfoCard("Identifiers") {
                    InfoRow("ID", boat.id?.toString() ?: "N/A")
                    InfoRow("External ID", boat.externalId ?: "N/A")
                    InfoRow("Owner ID", boat.ownerId?.toString() ?: "N/A")
                }
            }
        }
    ) {
        // Map as full background (without its own bottom sheet)
        Box(modifier = Modifier.fillMaxSize()) {
            if (boat.latitude != null && boat.longitude != null) {
                OverviewMapBackground(
                    boat = boat,
                    mapCameraState = mapCameraState
                )
            } else {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No location data available",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.Gray
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoCard(
    title: String,
    content: @Composable () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, shape = MaterialTheme.shapes.medium)
            .padding(16.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = OceanBlue,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        content()
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            color = Color(0xFF1D2124),
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}

@Composable
private fun OverviewMapBackground(
    boat: org.dadez.safarban.domain.model.Boat,
    mapCameraState: androidx.compose.runtime.MutableState<MapCameraState>
) {
    val recenter = remember { mutableStateOf(false) }
    val locations = listOf(
        org.dadez.safarban.ui.components.maps.LocationItem(
            id = boat.externalId ?: boat.id?.toString() ?: "boat",
            name = boat.name ?: "Unknown",
            description = boat.location ?: boat.type ?: "",
            latitude = boat.latitude ?: 0.0,
            longitude = boat.longitude ?: 0.0
        )
    )

    MapContent(
        userLocation = null,
        initialCameraState = mapCameraState.value,
        recenter = recenter,
        bottomSheetHeight = 0.dp,
        onBottomSheetHeightChanged = {},
        listState = rememberLazyListState(),
        locations = locations,
        shouldAnimateRefresh = false,
        onRefresh = {},
        onRefreshAnimationComplete = {},
        onLocationClick = {},
        onCameraMove = { lat, lon, zoom ->
            mapCameraState.value = MapCameraState(lat, lon, zoom)
        },
        selectedBoatId = boat.externalId ?: boat.id?.toString(),
        selectedBoatName = boat.name,
        selectedCameraLat = boat.latitude,
        selectedCameraLon = boat.longitude,
        showFab = false,
        sheetContainerColor = Color.Transparent,
        sheetContentColor = Color(0xFF1D2124),
        cardBackgroundColor = Color.White,
        cardContentColor = Color(0xFF1D2124),
        cardBorderColor = OceanBlue,
        cardBorderWidth = 2.dp,
        isOverview = true,
        showUserLocation = false
    )
}


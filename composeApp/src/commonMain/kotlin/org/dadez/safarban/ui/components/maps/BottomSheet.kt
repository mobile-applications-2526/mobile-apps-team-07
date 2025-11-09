package org.dadez.safarban.ui.components.maps

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.RefreshCw
import com.composables.icons.lucide.Ship
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

data class LocationItem(
    val id: String,
    val name: String,
    val description: String,
    val latitude: Double,
    val longitude: Double
)

@Composable
fun BottomSheet(
    modifier: Modifier = Modifier,
    // Max height ratio (expanded) - default to 70% of screen height
    maxHeightRatio: Float = 0.7f,
    onHeightChanged: ((Dp) -> Unit)? = null,
    locations: List<LocationItem> = emptyList(),
    userLat: Double? = null,
    userLon: Double? = null,
    onLocationClick: (LocationItem) -> Unit = {},
    onRefresh: (() -> Unit)? = null,
    isLoading: Boolean = false,
    shouldAnimateRefresh: Boolean = false,
    onRefreshAnimationComplete: (() -> Unit)? = null,
    listState: LazyListState,
    // Debugging values to show in the sheet (optional)
    debugCameraLat: Double? = null,
    debugCameraLon: Double? = null,
    debugZoom: Double? = null,
    debugBoatName: String? = null,
    debugBoatLat: Double? = null,
    debugBoatLon: Double? = null,
    debugVerticalDeg: Double? = null,
    // Styling overrides (defaults preserve current dark style)
    containerColor: Color = Color(0xFF1D2124),
    contentColor: Color = Color.White,
    cardBackgroundColor: Color = Color(0xFF2A2D32),
    cardContentColor: Color = Color(0xFFBDBDBD),
    cardBorderColor: Color = Color.Transparent,
    cardBorderWidth: Dp = 0.dp,
    // New: when true render the overview layout (handle + paired cells)
    isOverview: Boolean = false
) {
    val density = LocalDensity.current

    // Calculate screen height in pixels
    val screenHeightPx = with(density) {
        // Using a reasonable default height for calculation
        800.dp.toPx()
    }

    // Expanded height is 70% of screen (configurable via maxHeightRatio)
    val expandedPx = screenHeightPx * maxHeightRatio
    // Collapsed height should be smaller than expanded so the sheet can be dragged
    // We'll use 30% of screen as the collapsed height to give a visible handle/content and allow dragging
    val collapsedPx = screenHeightPx * 0.30f
    // Start the sheet at the expanded height (70%) so it appears tall initially but remains draggable
    val initialPx = expandedPx // start at the 70% height

    var heightPx by rememberSaveable { mutableFloatStateOf(initialPx) }
    var isDragging by remember { mutableStateOf(false) }

    val heightDp by remember(heightPx) { derivedStateOf { with(density) { heightPx.toDp() } } }
    val animatedHeightDp by animateDpAsState(targetValue = heightDp, label = "BottomSheetHeightAnimation")

    val rotation = remember { Animatable(0f) }

    val sortedLocations = remember(locations, userLat, userLon) {
        if (userLat != null && userLon != null) {
            locations.sortedBy { location ->
                calculateDistance(userLat, userLon, location.latitude, location.longitude)
            }
        } else {
            locations
        }
    }

    LaunchedEffect(heightDp, animatedHeightDp, isDragging) {
        val reportHeight = if (isDragging) heightDp else animatedHeightDp
        onHeightChanged?.invoke(reportHeight)
    }

    LaunchedEffect(shouldAnimateRefresh) {
        if (shouldAnimateRefresh) {
            rotation.snapTo(0f)
            rotation.animateTo(360f, animationSpec = tween(durationMillis = 800))
            rotation.snapTo(0f)
            onRefreshAnimationComplete?.invoke()
        }
    }

    val bottomContentPadding = 20.dp

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(animatedHeightDp),
        color = containerColor,
        shape = RoundedCornerShape(topStart = 40.dp, topEnd = 40.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(36.dp),
                contentAlignment = Alignment.Center
            ) {
                // Handle bar for dragging
                Box(
                    modifier = Modifier
                        .width(36.dp)
                        .height(6.dp)
                        .draggable(
                            state = rememberDraggableState { delta ->
                                // delta is in pixels; invert sign to match vertical drag direction
                                val newHeight = (heightPx - delta).coerceIn(collapsedPx, expandedPx)
                                heightPx = newHeight
                            },
                            orientation = Orientation.Vertical,
                            onDragStarted = { isDragging = true },
                            onDragStopped = { isDragging = false }
                        )
                        .background(color = Color(0xFFBDBDBD), shape = RoundedCornerShape(3.dp))
                )
            }

            // Debug block rendered at top of the sheet (above cells) when debug values present
//            if (debugCameraLat != null || debugBoatName != null) {
//                // Simple formatter for debug doubles: show 6 decimals
//                fun fmt(d: Double?) = d?.let {
//                    val factor = 1_000_000.0
//                    val rounded = kotlin.math.round(it * factor) / factor
//                    var s = rounded.toString()
//                    if (!s.contains('.')) s += "." + "0".repeat(6)
//                    val parts = s.split('.')
//                    val frac = (parts.getOrElse(1) { "" } + "0".repeat(6)).substring(0, 6)
//                    parts[0] + "." + frac
//                } ?: "-"
//
//                Card(
//                    modifier = Modifier
//                        .fillMaxWidth()
//                        .padding(horizontal = 12.dp, vertical = 6.dp),
//                    colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
//                    shape = RoundedCornerShape(10.dp),
//                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
//                ) {
//                    Column(modifier = Modifier.padding(10.dp)) {
//                        Text(text = "Debug — Center: ${fmt(debugCameraLat)}, ${fmt(debugCameraLon)}", color = cardContentColor)
//                        Text(text = "Zoom: ${debugZoom?.toString() ?: "-"}", color = cardContentColor)
//                        Text(text = "Boat: ${debugBoatName ?: "-"} @ ${fmt(debugBoatLat)}, ${fmt(debugBoatLon)}", color = cardContentColor)
//                        Text(text = "Vertical diff (deg): ${debugVerticalDeg?.let { String.format("%.6f", it) } ?: "-"}", color = cardContentColor)
//                    }
//                }
//            }

            // If this is the overview bottom sheet, render only the paired cells grid
            if (isOverview) {
                // Spacing between handle and content
                Spacer(modifier = Modifier.height(8.dp))

                // Make the overview content vertically scrollable so all cells can be viewed
                val scrollState = rememberScrollState()
                Column(modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 4.dp)) {

                    // Row 1: Current status & Current voyage
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        // Current Status Cell
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .padding(8.dp)
                                .height(120.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                                Text(text = "Current Status", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = cardContentColor)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "Atlantic Ocean", fontSize = 12.sp, color = cardContentColor)
                                Text(text = "228° | 12.8 kts", fontSize = 12.sp, color = cardContentColor)
                                Spacer(modifier = Modifier.weight(1f))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(8.dp).background(Color(0xFF4CAF50), shape = RoundedCornerShape(4.dp)))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = "In service", fontSize = 11.sp, color = Color(0xFF4CAF50), fontWeight = FontWeight.Medium)
                                }
                            }
                        }

                        // Current Voyage Cell
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .padding(8.dp)
                                .height(120.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                                Text(text = "Current Voyage", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = cardContentColor)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "V24-07", fontSize = 12.sp, color = cardContentColor, fontWeight = FontWeight.Medium)
                                Text(text = "TC - 10,500$/day", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.7f))
                            }
                        }
                    }

                    // Row 2: Quick stats & Alerts
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        // Quick Stats Cell
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .padding(8.dp)
                                .height(120.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                                Text(text = "Quick Stats", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = cardContentColor)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "Speed:", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.7f))
                                Text(text = "Fuel:", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.7f))
                                Text(text = "Cargo:", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.7f))
                            }
                        }

                        // Alerts Cell
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .padding(8.dp)
                                .height(120.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                                Text(text = "Alerts (IFANY)", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = cardContentColor)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "- - - - - -", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.5f))
                            }
                        }
                    }

                    // Row 3: Fuel consumption graph & Speed performance graph
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        // Fuel Consumption Graph Cell
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .padding(8.dp)
                                .height(140.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                                Text(text = "Fuel Consumption", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = cardContentColor)
                                Text(text = "Graph", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.7f))
                                Spacer(modifier = Modifier.height(8.dp))
                                // Simple bar chart representation
                                Row(
                                    modifier = Modifier.fillMaxWidth().weight(1f),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    listOf(18, 22, 16, 20, 15).forEach { value ->
                                        Box(
                                            modifier = Modifier
                                                .width(16.dp)
                                                .height((value * 2).dp)
                                                .background(Color(0xFF4CAF50), shape = RoundedCornerShape(2.dp))
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("5", fontSize = 9.sp, color = cardContentColor.copy(alpha = 0.6f))
                                    Text("10", fontSize = 9.sp, color = cardContentColor.copy(alpha = 0.6f))
                                    Text("15", fontSize = 9.sp, color = cardContentColor.copy(alpha = 0.6f))
                                    Text("20", fontSize = 9.sp, color = cardContentColor.copy(alpha = 0.6f))
                                }
                            }
                        }

                        // Speed Performance Graph Cell
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .padding(8.dp)
                                .height(140.dp),
                            colors = CardDefaults.cardColors(containerColor = cardBackgroundColor),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                                Text(text = "Speed Performance", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = cardContentColor)
                                Text(text = "Graph", fontSize = 11.sp, color = cardContentColor.copy(alpha = 0.7f))
                                Spacer(modifier = Modifier.height(8.dp))
                                // Simple line chart representation with dots
                                Row(
                                    modifier = Modifier.fillMaxWidth().weight(1f),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    listOf(12, 15, 13, 14, 12).forEach { value ->
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .background(Color(0xFF2196F3), shape = RoundedCornerShape(4.dp))
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("3", fontSize = 9.sp, color = cardContentColor.copy(alpha = 0.6f))
                                    Text("10", fontSize = 9.sp, color = cardContentColor.copy(alpha = 0.6f))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(bottomContentPadding))
                }

            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.Start),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Ships",
                        color = contentColor,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Icon(
                        imageVector = Lucide.RefreshCw,
                        contentDescription = "Refresh",
                        tint = if (onRefresh != null && !rotation.isRunning) contentColor.copy(alpha = 0.8f) else Color.Gray,
                        modifier = Modifier
                            .size(24.dp)
                            .graphicsLayer { rotationZ = rotation.value }
                            .clickable(enabled = onRefresh != null && !rotation.isRunning) {
                                onRefresh?.invoke()
                            }
                    )
                }

                if (sortedLocations.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = contentColor)
                        } else {
                            Text("No nearby places found.", color = contentColor.copy(alpha = 0.7f))
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        state = listState,
                        contentPadding = PaddingValues(bottom = bottomContentPadding)
                    ) {
                        items(sortedLocations, key = { it.id }) { location ->
                            LocationCard(
                                location = location,
                                userLat = userLat,
                                userLon = userLon,
                                onClick = { onLocationClick(location) },
                                cardBackgroundColor = cardBackgroundColor,
                                cardContentColor = cardContentColor,
                                cardBorderColor = cardBorderColor,
                                cardBorderWidth = cardBorderWidth
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LocationCard(
    location: LocationItem,
    userLat: Double?,
    userLon: Double?,
    onClick: () -> Unit,
    cardBackgroundColor: Color,
    cardContentColor: Color,
    cardBorderColor: Color,
    cardBorderWidth: Dp
) {
    val distance = if (userLat != null && userLon != null) {
        calculateDistance(userLat, userLon, location.latitude, location.longitude)
    } else null

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .then(
                if (cardBorderWidth > 0.dp && cardBorderColor != Color.Transparent) {
                    Modifier.border(width = cardBorderWidth, color = cardBorderColor, shape = RoundedCornerShape(12.dp))
                } else Modifier
            )
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = cardBackgroundColor
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top // align children to top so distance sits next to name
        ) {
            Icon(
                imageVector = Lucide.Ship,
                contentDescription = "Ship",
                tint = cardContentColor,
                modifier = Modifier.size(20.dp)
            )

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = location.name,
                    color = cardContentColor,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )

                Text(
                    text = location.description,
                    color = cardContentColor.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )

                Text(
                    text = "Carrying ${location.id}", // Using id as material/cargo identifier
                    color = cardContentColor.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }

            // Distance aligned to the top, beside the ship name
            if (distance != null) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.Top
                ) {
                    Text(
                        text = formatDistance(distance),
                        color = cardContentColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val earthRadius = 6371.0
    val dLat = (lat2 - lat1).toRadians()
    val dLon = (lon2 - lon1).toRadians()

    val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(lat1.toRadians()) * cos(lat2.toRadians()) *
            sin(dLon / 2) * sin(dLon / 2)

    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earthRadius * c
}

private fun formatDistance(distanceKm: Double): String {
    return when {
        distanceKm < 0.1 -> "< 100m"
        distanceKm < 1.0 -> "${(distanceKm * 1000).roundToInt()}m"
        else -> {
            val roundedTenth = (distanceKm * 10).roundToInt() / 10.0
            "${roundedTenth}km"
        }
    }
}

private fun Double.toRadians(): Double = this * PI / 180.0

package org.dadez.safarban.ui.components.maps

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.RefreshCw
import com.composables.icons.lucide.Ship
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.roundToInt

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
    maxHeightRatio: Float = 0.85f,
    onHeightChanged: ((Dp) -> Unit)? = null,
    locations: List<LocationItem> = emptyList(),
    userLat: Double? = null,
    userLon: Double? = null,
    onLocationClick: (LocationItem) -> Unit = {},
    onRefresh: (() -> Unit)? = null,
    isLoading: Boolean = false,
    shouldAnimateRefresh: Boolean = false,
    onRefreshAnimationComplete: (() -> Unit)? = null,
    listState: LazyListState
) {
    val density = LocalDensity.current

    // Calculate screen height in pixels
    val screenHeightPx = with(density) {
        // Using a reasonable default height for calculation
        800.dp.toPx()
    }

    val collapsedPx = with(density) { 160.dp.toPx() }
    val expandedPx = screenHeightPx * maxHeightRatio
    //val initialPx = ((expandedPx - collapsedPx) / 2f + collapsedPx).coerceIn(collapsedPx, expandedPx) // Start at low point
    val initialPx = collapsedPx // Start collapsed

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
        color = Color(0xFF1D2124),
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
                        .pointerInput(Unit) {
                            detectVerticalDragGestures(
                                onDragStart = { isDragging = true },
                                onDragEnd = { isDragging = false },
                                onDragCancel = { isDragging = false }
                            ) { _, dragAmount ->
                                val newHeight = (heightPx - dragAmount).coerceIn(collapsedPx, expandedPx)
                                heightPx = newHeight
                            }
                        }
                        .background(color = Color(0xFFBDBDBD), shape = RoundedCornerShape(3.dp))
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.Start),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Neaby ships",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
//                Text(
//                    text = "↻",
//                    color = Color.White.copy(alpha = 0.8f),
//                    fontSize = 28.sp,
//                    modifier = Modifier
//                        .padding(start = 8.dp)
//                        .graphicsLayer { rotationZ = rotation.value }
//                        .clickable(enabled = onRefresh != null && !rotation.isRunning) {
//                            onRefresh?.invoke()
//                        }
//                )
                Icon(
                    imageVector = Lucide.RefreshCw,
                    contentDescription = "Refresh",
                    tint = if (onRefresh != null && !rotation.isRunning) Color.White.copy(alpha = 0.8f) else Color.Gray,
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
                        CircularProgressIndicator(color = Color.White)
                    } else {
                        Text("No nearby places found.", color = Color.White.copy(alpha = 0.7f))
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
                            onClick = { onLocationClick(location) }
                        )
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
    onClick: () -> Unit
) {
    val distance = if (userLat != null && userLon != null) {
        calculateDistance(userLat, userLon, location.latitude, location.longitude)
    } else null

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF2A2D32)
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
                tint = Color(0xFFBDBDBD),
                modifier = Modifier.size(20.dp)
            )

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = location.name,
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )

                Text(
                    text = location.description,
                    color = Color(0xFFBDBDBD),
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )

                Text(
                    text = "Carrying ${location.id}", // Using id as material/cargo identifier
                    color = Color(0xFFBDBDBD),
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
                        color = Color(0xFF81C784),
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

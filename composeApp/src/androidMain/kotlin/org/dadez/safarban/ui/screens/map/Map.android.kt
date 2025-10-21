package org.dadez.safarban.ui.screens.map

import android.content.Context
import android.view.MotionEvent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import org.dadez.safarban.R
import org.dadez.safarban.domain.model.UserLocation
import org.dadez.safarban.ui.components.maps.LocationItem
import org.osmdroid.config.Configuration
import org.osmdroid.events.MapListener
import org.osmdroid.events.ScrollEvent
import org.osmdroid.events.ZoomEvent
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker

/**
 * A simple Compose wrapper around osmdroid's MapView.
 * - Restores last camera position from initialCameraState
 * - Reports camera movements via onCameraMove callback
 * - Centers on userLocation when provided
 * - Shows a marker at the user's location
 * - Renders boat markers for all boat locations
 */
@Composable
actual fun OpenStreetMap(
    modifier: Modifier,
    userLocation: UserLocation?,
    boatLocations: List<LocationItem>,
    initialCameraState: MapCameraState,
    recenter: MutableState<Boolean>,
    onRecenterComplete: () -> Unit,
    onCameraMove: (latitude: Double, longitude: Double, zoom: Double) -> Unit
) {
    val context = LocalContext.current
    val mapViewRef = remember { mutableStateOf<MapView?>(null) }
    val userMarkerRef = remember { mutableStateOf<Marker?>(null) }
    val boatMarkersRef = remember { mutableStateOf<List<Marker>>(emptyList()) }

    // Track if we've restored the initial camera state
    val didRestoreCamera = remember { mutableStateOf(false) }

    // Track if the user has interacted with the map
    val userInteracted = remember { mutableStateOf(false) }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            // Load osmdroid config
            Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))

            val mapView = MapView(ctx).apply {
                setTileSource(org.osmdroid.tileprovider.tilesource.TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)
                minZoomLevel = 3.0

                // Prevent horizontal scroll wrapping (multiple world maps)
                isHorizontalMapRepetitionEnabled = false
                setScrollableAreaLimitDouble(null) // Allow full map scrolling but without repetition

                // Restore camera state from ViewModel (remembers scroll position)
                controller.setZoom(initialCameraState.zoom)
                controller.setCenter(GeoPoint(initialCameraState.latitude, initialCameraState.longitude))

                // Ensure full-bleed map
                try { this.fitsSystemWindows = false } catch (_: Throwable) {}
                try { this.clipToPadding = false } catch (_: Throwable) {}
                try { this.setPadding(0, 0, 0, 0) } catch (_: Throwable) {}
                try { this.setBackgroundColor(android.graphics.Color.TRANSPARENT) } catch (_: Throwable) {}

                // Add map listener to track camera movements (saves scroll position)
                addMapListener(object : MapListener {
                    override fun onScroll(event: ScrollEvent?): Boolean {
                        event?.let {
                            val center = mapCenter as? GeoPoint
                            center?.let {
                                onCameraMove(it.latitude, it.longitude, zoomLevelDouble)
                            }
                        }
                        return true
                    }

                    override fun onZoom(event: ZoomEvent?): Boolean {
                        event?.let {
                            val center = mapCenter as? GeoPoint
                            center?.let {
                                onCameraMove(it.latitude, it.longitude, zoomLevelDouble)
                            }
                        }
                        return true
                    }
                })

                // Detect user touch to prevent forced recentering
                setOnTouchListener { v, event ->
                    try {
                        if (event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_MOVE) {
                            userInteracted.value = true
                        }
                        if (event.action == MotionEvent.ACTION_UP) {
                            try { v.performClick() } catch (_: Throwable) { }
                        }
                    } catch (_: Throwable) { }
                    false
                }
            }

            // Create a dedicated marker for the user
            val userMarkerDrawable = ContextCompat.getDrawable(ctx, R.drawable.current_location)
            val initialUserMarker = Marker(mapView).apply {
                position = GeoPoint(0.0, 0.0)
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                icon = userMarkerDrawable
                title = "You are here"
            }
            mapView.overlays.add(initialUserMarker)
            userMarkerRef.value = initialUserMarker

            // Create boat markers for all boat locations
            val boatMarkerDrawable = ContextCompat.getDrawable(ctx, R.drawable.fishing_boat)
            val boatMarkers = boatLocations.map { location ->
                Marker(mapView).apply {
                    position = GeoPoint(location.latitude, location.longitude)
                    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                    icon = boatMarkerDrawable
                    title = location.name
                    snippet = location.description
                }
            }
            boatMarkers.forEach { mapView.overlays.add(it) }
            boatMarkersRef.value = boatMarkers

            // Ensure the MapView lifecycle is resumed
            try { mapView.onResume() } catch (_: Throwable) {}
            try { mapView.setWillNotDraw(false) } catch (_: Throwable) {}

            mapViewRef.value = mapView
            didRestoreCamera.value = true
            mapView
        },
        update = { mapView ->
            // Update user marker position
            userLocation?.let { loc ->
                val gp = GeoPoint(loc.latitude, loc.longitude)
                userMarkerRef.value?.position = gp

                // Auto-center on first location fix (if user hasn't interacted)
                if (!userInteracted.value && didRestoreCamera.value) {
                    try {
                        mapView.controller.animateTo(gp)
                        userInteracted.value = true // Mark as interacted after first auto-center
                    } catch (_: Throwable) { }
                }

                // Handle explicit recenter request from FAB
                if (recenter.value) {
                    try {
                        mapView.controller.animateTo(gp)
                        userInteracted.value = false // Reset so auto-centering works again if needed
                    } catch (_: Throwable) { }
                    onRecenterComplete()
                }
            }

            // Update boat markers if locations changed
            if (boatMarkersRef.value.size != boatLocations.size) {
                // Remove old boat markers
                boatMarkersRef.value.forEach { mapView.overlays.remove(it) }

                // Add new boat markers
                val boatMarkerDrawable = ContextCompat.getDrawable(context, R.drawable.fishing_boat)
                val newBoatMarkers = boatLocations.map { location ->
                    Marker(mapView).apply {
                        position = GeoPoint(location.latitude, location.longitude)
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                        icon = boatMarkerDrawable
                        title = location.name
                        snippet = location.description
                    }
                }
                newBoatMarkers.forEach { mapView.overlays.add(it) }
                boatMarkersRef.value = newBoatMarkers
            }

            // Redraw map overlays
            try { mapView.invalidate() } catch (_: Throwable) { }
        }
    )

    DisposableEffect(Unit) {
        onDispose {
            mapViewRef.value?.let { mapView ->
                try { mapView.onPause() } catch (_: Throwable) {}
            }
        }
    }
}

package org.dadez.safarban.ui.screens.map

import android.content.Context
import android.graphics.Point
import android.util.Log
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
    // optional filters (no default values in actuals)
    selectedBoatId: String?,
    selectedBoatName: String?,
    // explicit camera center override (no defaults here)
    selectedCameraLat: Double?,
    selectedCameraLon: Double?,
    initialCameraState: MapCameraState,
    recenter: MutableState<Boolean>,
    onRecenterComplete: () -> Unit,
    onCameraMove: (latitude: Double, longitude: Double, zoom: Double) -> Unit
    ,
    showUserLocation: Boolean
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

            // Do NOT create a user marker at startup. Create it only when a real userLocation is available.
            // This prevents showing a spurious marker (e.g. at 0,0) on screens that intentionally pass null.
            userMarkerRef.value = null

            // Create boat markers. If a selection filter is provided, only create markers for matching boats
            val boatMarkerDrawable = ContextCompat.getDrawable(ctx, R.drawable.fishing_boat)
            val filteredBoatLocations = if (!selectedBoatId.isNullOrBlank() || !selectedBoatName.isNullOrBlank()) {
                boatLocations.filter { loc ->
                    (!selectedBoatId.isNullOrBlank() && loc.id.equals(selectedBoatId, ignoreCase = true)) ||
                    (!selectedBoatName.isNullOrBlank() && loc.name.equals(selectedBoatName, ignoreCase = true))
                }
            } else {
                boatLocations
            }

            val boatMarkers = filteredBoatLocations.map { location ->
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
            // Defensive: remove any pre-existing 'You are here' markers that might have been left behind
            try {
                val toRemove = mapView.overlays.filterIsInstance<Marker>().filter { it.title == "You are here" }
                toRemove.forEach { mapView.overlays.remove(it) }
            } catch (_: Throwable) {}

            mapView
        },
        update = { mapView ->
            // Debug: log whether user location rendering is allowed and the provided userLocation
            try { Log.d("MapDebug", "update called: showUserLocation=$showUserLocation userLocation=${'$'}userLocation") } catch (_: Throwable) {}
            // Update user marker position or create/remove marker depending on presence of userLocation
            if (showUserLocation && userLocation != null) {
                val loc = userLocation
                val gp = GeoPoint(loc.latitude, loc.longitude)

                // Create marker if not present
                if (userMarkerRef.value == null) {
                    try {
                        val userMarkerDrawable = ContextCompat.getDrawable(context, R.drawable.current_location)
                        val marker = Marker(mapView).apply {
                            position = gp
                            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                            icon = userMarkerDrawable
                            title = "You are here"
                        }
                        mapView.overlays.add(marker)
                        userMarkerRef.value = marker
                    } catch (_: Throwable) { /* ignore marker creation failures */ }
                } else {
                    // Update existing marker position
                    try { userMarkerRef.value?.position = gp } catch (_: Throwable) {}
                }

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
            } else {
                // No user location allowed or not provided: remove any existing user marker to avoid stale/spurious marker on screen
                userMarkerRef.value?.let { existing ->
                    try { mapView.overlays.remove(existing) } catch (_: Throwable) {}
                    userMarkerRef.value = null
                }
            }

            // Update boat markers if locations changed
            if (boatMarkersRef.value.size != boatLocations.size) {
                // Remove old boat markers
                boatMarkersRef.value.forEach { mapView.overlays.remove(it) }

                // Add new boat markers (apply selection filter if provided)
                val boatMarkerDrawable = ContextCompat.getDrawable(context, R.drawable.fishing_boat)
                val filteredBoatLocations = if (!selectedBoatId.isNullOrBlank() || !selectedBoatName.isNullOrBlank()) {
                    boatLocations.filter { loc ->
                        (!selectedBoatId.isNullOrBlank() && loc.id.equals(selectedBoatId, ignoreCase = true)) ||
                        (!selectedBoatName.isNullOrBlank() && loc.name.equals(selectedBoatName, ignoreCase = true))
                    }
                } else {
                    boatLocations
                }

                val newBoatMarkers = filteredBoatLocations.map { location ->
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

            // If a recenter was requested (e.g., opening a dynamic boat overview), focus the map
            if (recenter.value) {
                try {
                    // Prefer using the passed initialCameraState center (so offsets/adjustments are respected).
                    // Fallback to first boat marker position or user location if initialCameraState is not set.
                    val hasValidInitial = !initialCameraState.latitude.isNaN() && !initialCameraState.longitude.isNaN()
                    // prefer explicit camera overrides (selectedCameraLat/Lon) if provided
                    val hasSelectedCamera = selectedCameraLat != null && selectedCameraLon != null
                    val targetBaseGeo = when {
                        hasSelectedCamera -> GeoPoint(selectedCameraLat!!, selectedCameraLon!!)
                        hasValidInitial -> GeoPoint(initialCameraState.latitude, initialCameraState.longitude)
                        boatMarkersRef.value.isNotEmpty() -> {
                            val loc = boatMarkersRef.value[0].position as GeoPoint
                            GeoPoint(loc.latitude, loc.longitude)
                        }
                        userLocation != null -> GeoPoint(userLocation.latitude, userLocation.longitude)
                        else -> null
                    }

                    Log.d("MapDebug", "recenter requested: selectedCamera=$selectedCameraLat,$selectedCameraLon initial=${initialCameraState.latitude},${initialCameraState.longitude}")
                    targetBaseGeo?.let { baseGeo ->
                         // Run projection-based adjustments after the view is laid out so mapView.height is valid.
                         mapView.post {
                             try {
                                 Log.d("MapDebug", "baseGeo=${baseGeo.latitude},${baseGeo.longitude} mapHeight=${mapView.measuredHeight}/${mapView.height}")
                                 val projection = mapView.projection
                                 val screenPt = Point()
                                 projection.toPixels(baseGeo, screenPt)

                                 // desired upward shift: 20% of visible map height (adjustable)
                                 val mapHeight = if (mapView.measuredHeight > 0) mapView.measuredHeight else mapView.height
                                 val desiredShiftPx = (mapHeight * 0.20).toInt()

                                 val newScreenY = screenPt.y - desiredShiftPx
                                 val newCenterGeo = projection.fromPixels(screenPt.x, newScreenY)
                                 Log.d("MapDebug", "screenPt=$screenPt newScreenY=$newScreenY newCenterGeo=${newCenterGeo.latitude},${newCenterGeo.longitude}")

                                 // set zoom and animate to adjusted center
                                 try { mapView.controller.setZoom(initialCameraState.zoom) } catch (t: Throwable) { Log.w("MapDebug","zoom set failed", t) }
                                 mapView.controller.animateTo(newCenterGeo as GeoPoint)
                             } catch (t: Throwable) {
                                // fallback to simple animate
                                Log.w("MapDebug","projection shift failed", t)
                                try { mapView.controller.setZoom(initialCameraState.zoom) } catch (t2: Throwable) { Log.w("MapDebug","zoom set failed", t2) }
                                mapView.controller.animateTo(baseGeo)
                             }
                         }
                     }
                } catch (_: Throwable) { }
                // Notify that recenter has been handled
                try { onRecenterComplete() } catch (_: Throwable) {}
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

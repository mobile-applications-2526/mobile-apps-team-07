package org.dadez.safarban.ui.screens.map

import android.content.Context
import android.location.Location
import android.view.MotionEvent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import org.dadez.safarban.R
import org.osmdroid.config.Configuration
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker

/**
 * A simple Compose wrapper around osmdroid's MapView.
 * - centers on `userLocation` when provided
 * - shows a marker at the user's location
 */
@Composable
actual fun OpenStreetMap(
    modifier: Modifier,
    userLocation: Any?,
    zoom: Double,
    recenter: State<Boolean>,
    onRecenterComplete: () -> Unit
) {
    val composeCtx = LocalContext.current
    val mapViewRef = remember { mutableStateOf<MapView?>(null) }
    val userMarkerRef = remember { mutableStateOf<Marker?>(null) }

    // Cast the userLocation from Any? to Location?
    val location = userLocation as? Location

    // One-time auto-center flag (survives simple config changes)
    val didAutoCenter = rememberSaveable { mutableStateOf(false) }
    // If the user touches/pans the map we consider them as "userInteracted" and won't re-center automatically
    val userInteracted = remember { mutableStateOf(false) }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            // Load osmdroid config (userAgent & proper cache path) before creating the view
            Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))

            val mapView = MapView(ctx).apply {
                setTileSource(org.osmdroid.tileprovider.tilesource.TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)
                controller.setZoom(zoom)
                // Default center (can be changed to any location)
                controller.setCenter(GeoPoint(50.8798, 4.7005)) // Leuven, Belgium

                // Ensure the MapView doesn't automatically fit system windows — we want it full-bleed
                try { this.fitsSystemWindows = false } catch (_: Throwable) {}

                // Make sure window inset callbacks don't add padding; keep everything full-bleed so tiles
                // can draw under the status bar / navigation bar. We still position overlays in Compose.
                try {
                    androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(this) { v, insets ->
                        try { v.setPadding(0, 0, 0, 0) } catch (_: Throwable) {}
                        insets
                    }
                } catch (_: Throwable) {}

                // Respect system top inset so tiles render into the safe area (avoid white strip at top)
                try {
                    val insets = ViewCompat.getRootWindowInsets(this)
                    val top = insets?.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars())?.top ?: 0
                    if (top > 0) {
                        // Instead of shifting the content down with padding (which can leave a white strip),
                        // allow the MapView to draw into the system inset area and ensure it won't clip to padding.
                        try {
                            // disable clipping so children/tile renderers can draw into the padding area
                            this.clipToPadding = false
                        } catch (_: Throwable) {}
                        // Ensure background is transparent so tiles are visible under system bars
                        try { this.setBackgroundColor(android.graphics.Color.TRANSPARENT) } catch (_: Throwable) {}

                        try { setPadding(0, 0, 0, 0) } catch (_: Throwable) {}
                    }
                } catch (_: Throwable) {}

                // Force zero padding / no clipping and re-layout so the internal tile renderer
                // recalculates with the full, unpadded view size.
                try {
                    this.fitsSystemWindows = false
                } catch (_: Throwable) {}
                try {
                    this.clipToPadding = false
                } catch (_: Throwable) {}
                try { this.setPadding(0, 0, 0, 0) } catch (_: Throwable) {}
                try { this.setBackgroundColor(android.graphics.Color.TRANSPARENT) } catch (_: Throwable) {}
                try { this.invalidate() } catch (_: Throwable) {}
                try { this.requestLayout() } catch (_: Throwable) {}

                // detect user touch to prevent forced recentering after the first auto-center
                setOnTouchListener { v, event ->
                    try {
                        if (event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_MOVE) {
                            // Mark that the user interacted so we avoid forced auto-recentering
                            userInteracted.value = true
                        }
                        if (event.action == MotionEvent.ACTION_UP) {
                            try { v.performClick() } catch (_: Throwable) { }
                        }
                    } catch (_: Throwable) { }
                    false
                }
            }

            // create a dedicated marker for the user
            val userMarkerDrawable = ContextCompat.getDrawable(ctx, R.drawable.current_location)
            val initialUserMarker = Marker(mapView).apply {
                position = GeoPoint(0.0, 0.0)
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                icon = userMarkerDrawable
                title = "You are here"
            }
            mapView.overlays.add(initialUserMarker)
            userMarkerRef.value = initialUserMarker

            // Ensure the MapView lifecycle is resumed so tile rendering and internal state are active.
            try { mapView.onResume() } catch (_: Throwable) {}

            // Ensure the view will draw and re-apply window insets so the tile renderer recalculates.
            try { mapView.setWillNotDraw(false) } catch (_: Throwable) {}
            try { ViewCompat.requestApplyInsets(mapView) } catch (_: Throwable) {}

            mapViewRef.value = mapView
            mapView
        },
        update = { mapView ->
            // update user marker and optional one-time auto-centering
            location?.let { loc ->
                val gp = GeoPoint(loc.latitude, loc.longitude)
                userMarkerRef.value?.position = gp

                // Auto-center exactly once on first fix (if user hasn't interacted)
                if (!didAutoCenter.value && !userInteracted.value) {
                    try { mapView.controller.animateTo(gp) } catch (_: Throwable) { }
                    didAutoCenter.value = true
                }

                if (recenter.value) {
                    mapView.controller.animateTo(gp)
                    onRecenterComplete()
                }
            }

            // redraw map overlays after sync
            try { mapView.invalidate() } catch (_: Throwable) { }
        }
    )

    DisposableEffect(Unit) {
        onDispose {
            // clean up the map view to avoid memory leaks
            mapViewRef.value?.onPause()
            mapViewRef.value?.onDetach()
        }
    }
}

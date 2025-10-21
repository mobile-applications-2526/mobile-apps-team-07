package org.dadez.safarban.ui.screens.map

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.readValue
import org.dadez.safarban.domain.model.UserLocation
import org.dadez.safarban.ui.components.maps.LocationItem
import platform.WebKit.WKWebView
import platform.WebKit.WKWebViewConfiguration
import platform.darwin.NSObject

/**
 * iOS implementation of OpenStreetMap using WKWebView with Leaflet.js.
 * - Uses OpenStreetMap tiles (no Apple Maps, no data collection)
 * - Restores last camera position from initialCameraState
 * - Reports camera movements via onCameraMove callback
 * - Centers on userLocation when provided
 * - Shows a marker at the user's location
 * - Renders boat markers for all boat locations
 * - Prevents horizontal map wrapping (single world map)
 */
@OptIn(ExperimentalForeignApi::class)
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
    val webViewRef = remember { mutableStateOf<WKWebView?>(null) }
    val hasAutocentered = remember { mutableStateOf(false) }
    val userInteracted = remember { mutableStateOf(false) }
    val isMapLoaded = remember { mutableStateOf(false) }

    // Generate boat markers JavaScript
    val boatMarkersJs = remember(boatLocations) {
        boatLocations.joinToString("\n") { location ->
            val escapedName = location.name.replace("'", "\\'")
            val escapedDesc = location.description?.replace("'", "\\'") ?: ""
            """
            L.marker([${location.latitude}, ${location.longitude}], {
                icon: L.icon({
                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgNEwxMiAxMkgyMEwxNiA0Wk0xMCAxNEw4IDIySDI0TDIyIDE0SDEwWk0xNiAyNEwxMiAyOEgyMEwxNiAyNFoiIGZpbGw9IiMzMzc3RkYiLz48L3N2Zz4=',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                })
            }).addTo(map).bindPopup('<b>$escapedName</b><br>$escapedDesc');
            """.trimIndent()
        }
    }

    val htmlContent = remember(initialCameraState, boatMarkersJs) {
        """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { width: 100vw; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', {
                    center: [${initialCameraState.latitude}, ${initialCameraState.longitude}],
                    zoom: ${initialCameraState.zoom},
                    zoomControl: true,
                    minZoom: 3,
                    maxBounds: [[-90, -180], [90, 180]], // Prevent horizontal wrapping
                    maxBoundsViscosity: 1.0 // Enforce bounds strictly
                });

                // Use OpenStreetMap tiles (no data collection)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    noWrap: true, // Prevent tile wrapping (single world map)
                    bounds: [[-90, -180], [90, 180]]
                }).addTo(map);

                // User location marker
                var userMarker = null;

                // Add boat markers
                $boatMarkersJs

                // Track map movements
                map.on('moveend', function() {
                    var center = map.getCenter();
                    var zoom = map.getZoom();
                    window.webkit.messageHandlers.mapMove.postMessage({
                        lat: center.lat,
                        lng: center.lng,
                        zoom: zoom
                    });
                });

                // Function to update user location
                function updateUserLocation(lat, lng) {
                    if (userMarker) {
                        userMarker.setLatLng([lat, lng]);
                    } else {
                        userMarker = L.marker([lat, lng], {
                            icon: L.icon({
                                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjNDA3OEZGIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==',
                                iconSize: [24, 24],
                                iconAnchor: [12, 12]
                            })
                        }).addTo(map);
                    }
                }

                // Function to recenter on user location
                function recenterMap(lat, lng) {
                    map.setView([lat, lng], 15, { animate: true });
                }

                // Notify that map is loaded
                window.webkit.messageHandlers.mapLoaded.postMessage('ready');
            </script>
        </body>
        </html>
        """.trimIndent()
    }

    UIKitView(
        modifier = modifier,
        interactive = true,
        factory = {
            val config = WKWebViewConfiguration()
            val webView = WKWebView(frame = platform.CoreGraphics.CGRectZero.readValue(), configuration = config)

            // Set up message handlers for communication
            config.userContentController.addScriptMessageHandler(
                object : NSObject(), platform.WebKit.WKScriptMessageHandlerProtocol {
                    override fun userContentController(
                        userContentController: platform.WebKit.WKUserContentController,
                        didReceiveScriptMessage: platform.WebKit.WKScriptMessage
                    ) {
                        isMapLoaded.value = true
                    }
                },
                "mapLoaded"
            )

            config.userContentController.addScriptMessageHandler(
                object : NSObject(), platform.WebKit.WKScriptMessageHandlerProtocol {
                    override fun userContentController(
                        userContentController: platform.WebKit.WKUserContentController,
                        didReceiveScriptMessage: platform.WebKit.WKScriptMessage
                    ) {
                        val body = didReceiveScriptMessage.body as? Map<*, *>
                        body?.let {
                            val lat = (it["lat"] as? Number)?.toDouble() ?: return@let
                            val lng = (it["lng"] as? Number)?.toDouble() ?: return@let
                            val zoom = (it["zoom"] as? Number)?.toDouble() ?: return@let
                            onCameraMove(lat, lng, zoom)
                        }
                    }
                },
                "mapMove"
            )

            webView.loadHTMLString(htmlContent, null)
            webViewRef.value = webView
            webView
        },
        update = { webView ->
            // Update user location marker
            userLocation?.let { loc ->
                if (isMapLoaded.value) {
                    webView.evaluateJavaScript("updateUserLocation(${loc.latitude}, ${loc.longitude});", null)

                    // Auto-center on first location fix
                    if (!hasAutocentered.value && !userInteracted.value) {
                        webView.evaluateJavaScript("recenterMap(${loc.latitude}, ${loc.longitude});", null)
                        hasAutocentered.value = true
                        userInteracted.value = true
                    }

                    // Handle recenter request
                    if (recenter.value) {
                        webView.evaluateJavaScript("recenterMap(${loc.latitude}, ${loc.longitude});", null)
                        userInteracted.value = false
                        onRecenterComplete()
                    }
                }
            }
        }
    )

    DisposableEffect(Unit) {
        onDispose {
            webViewRef.value?.let { webView ->
                webView.stopLoading()
            }
        }
    }
}

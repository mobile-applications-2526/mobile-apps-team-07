package org.dadez.safarban.ui.screens.map

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import org.dadez.safarban.data.location.LocationProvider
import org.dadez.safarban.data.location.LocationProviderImpl

/**
 * iOS implementation to get platform context
 */
@Composable
actual fun rememberPlatformContext(): Any {
    // iOS doesn't need a context object for CoreLocation
    return Unit
}

/**
 * iOS implementation to get LocationProvider with CLLocationManager
 */
@Composable
actual fun rememberLocationProvider(): LocationProvider {
    return remember {
        LocationProviderImpl()
    }
}


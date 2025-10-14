package org.dadez.safarban.ui.screens.map

import android.location.Location
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

/**
 * Android implementation: returns Android Context.
 */
@Composable
actual fun rememberPlatformContext(): Any {
    return LocalContext.current
}

/**
 * Extract latitude from Android Location object.
 */
actual fun getLatitude(location: Any?): Double? {
    return (location as? Location)?.latitude
}

/**
 * Extract longitude from Android Location object.
 */
actual fun getLongitude(location: Any?): Double? {
    return (location as? Location)?.longitude
}

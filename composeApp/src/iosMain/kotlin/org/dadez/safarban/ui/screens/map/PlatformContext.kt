package org.dadez.safarban.ui.screens.map

import androidx.compose.runtime.Composable

/**
 * iOS implementation: returns a placeholder context object.
 * TODO: Return proper iOS context when iOS support is implemented.
 */
@Composable
actual fun rememberPlatformContext(): Any {
    return object {} // Placeholder context for iOS
}

/**
 * Extract latitude from iOS location object.
 * TODO: Implement proper iOS location extraction when iOS support is added.
 */
actual fun getLatitude(location: Any?): Double? {
    return null // Placeholder for iOS
}

/**
 * Extract longitude from iOS location object.
 * TODO: Implement proper iOS location extraction when iOS support is added.
 */
actual fun getLongitude(location: Any?): Double? {
    return null // Placeholder for iOS
}

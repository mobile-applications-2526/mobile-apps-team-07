package org.dadez.safarban.data.location

import androidx.compose.runtime.Composable

/**
 * Handles location permission requests and state.
 * Platform-specific implementation.
 */
@Composable
expect fun RememberLocationPermissionState(
    context: Any,
    onPermissionGranted: () -> Unit
)


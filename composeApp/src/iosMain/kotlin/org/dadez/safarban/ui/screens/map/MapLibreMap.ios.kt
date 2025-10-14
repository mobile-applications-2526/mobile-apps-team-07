package org.dadez.safarban.ui.screens.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
actual fun OpenStreetMap(
    modifier: Modifier,
    userLocation: Any?,
    zoom: Double,
    recenter: State<Boolean>,
    onRecenterComplete: () -> Unit
) {
    // OpenStreetMap for iOS would need a different implementation
    // For now, we'll just use a placeholder
    Box(
        modifier = modifier.background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center
    ) {
        Text("Map view (iOS implementation pending)")
    }
}

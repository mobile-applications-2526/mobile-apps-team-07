package org.dadez.safarban.ui.screens.map

import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.ui.Modifier

@Composable
expect fun OpenStreetMap(
    modifier: Modifier = Modifier,
    userLocation: Any? = null,
    zoom: Double = 15.0,
    recenter: State<Boolean>,
    onRecenterComplete: () -> Unit
)

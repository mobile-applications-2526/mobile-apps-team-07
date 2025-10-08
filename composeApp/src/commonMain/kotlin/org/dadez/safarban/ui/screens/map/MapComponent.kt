package org.dadez.safarban.ui.screens.map

import kotlinx.coroutines.flow.StateFlow

interface MapComponent {
    val uiState: StateFlow<MapUiState>

    fun load()
}

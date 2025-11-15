package org.dadez.safarban.ui.screens.map

import kotlinx.coroutines.flow.StateFlow
import org.dadez.safarban.ui.components.maps.LocationItem

interface MapComponent {
    val uiState: StateFlow<MapUiState>
    val locations: StateFlow<List<LocationItem>>

    fun load()
}

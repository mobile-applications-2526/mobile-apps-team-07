package org.dadez.safarban.ui.screens.map

import kotlinx.coroutines.flow.StateFlow
import org.dadez.safarban.domain.model.UserLocation

interface MapViewModel {
    val uiState: StateFlow<MapUiState>

    fun load()
    fun updateUserLocation(location: UserLocation)
}

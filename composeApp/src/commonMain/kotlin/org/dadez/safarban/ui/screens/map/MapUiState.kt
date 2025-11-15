package org.dadez.safarban.ui.screens.map

data class MapUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val locations: List<org.dadez.safarban.ui.components.maps.LocationItem> = emptyList(),
    val userLocation: org.dadez.safarban.domain.model.UserLocation? = null
)

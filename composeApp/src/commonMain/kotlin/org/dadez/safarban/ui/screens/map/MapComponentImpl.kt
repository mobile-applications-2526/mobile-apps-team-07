package org.dadez.safarban.ui.screens.map

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MapComponentImpl(
    componentContext: ComponentContext,
    private val boatRepository: org.dadez.safarban.domain.repository.BoatRepository
) : MapComponent, ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(MapUiState())
    override val uiState: StateFlow<MapUiState> = _uiState

    private val _locations = kotlinx.coroutines.flow.MutableStateFlow<List<org.dadez.safarban.ui.components.maps.LocationItem>>(emptyList())
    override val locations: StateFlow<List<org.dadez.safarban.ui.components.maps.LocationItem>> = _locations

    override fun load() {
        // load boat locations from repository
        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Default).launch {
            try {
                val boats = boatRepository.getAllBoats()
                val locs = boats.map { b ->
                    org.dadez.safarban.ui.components.maps.LocationItem(
                        id = b.externalId ?: (b.name ?: "unknown"),
                        name = b.name ?: "Unknown",
                        description = b.location ?: b.type ?: "",
                        latitude = b.latitude ?: 0.0,
                        longitude = b.longitude ?: 0.0
                    )
                }
                _locations.value = locs
            } catch (_: Throwable) {
                // ignore
            }
        }
    }
}

package org.dadez.safarban.ui.screens.map

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.dadez.safarban.domain.repository.BoatRepository

class MapComponentImpl(
    componentContext: ComponentContext,
    private val boatRepository: BoatRepository
) : MapComponent, ComponentContext by componentContext {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val _uiState = MutableStateFlow(MapUiState())
    override val uiState: StateFlow<MapUiState> = _uiState

    init {
        load()
    }

    override fun load() {
        scope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val boats = boatRepository.getAllBoats()
                val locations = boats.mapNotNull { b ->
                    if (b.latitude != null && b.longitude != null) {
                        // Prefer the database numeric ID for navigation so Boat screen receives a parseable id
                        org.dadez.safarban.ui.components.maps.LocationItem(
                            id = b.id?.toString() ?: b.externalId ?: (b.name ?: "unknown"),
                            name = b.name ?: "Unknown",
                            description = b.location ?: b.type ?: "",
                            latitude = b.latitude,
                            longitude = b.longitude
                        )
                    } else null
                }
                _uiState.value = _uiState.value.copy(isLoading = false, locations = locations)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    override fun updateUserLocation(location: org.dadez.safarban.domain.model.UserLocation) {
        _uiState.value = _uiState.value.copy(userLocation = location)
    }
}

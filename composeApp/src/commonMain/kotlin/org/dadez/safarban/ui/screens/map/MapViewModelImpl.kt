package org.dadez.safarban.ui.screens.map

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.dadez.safarban.domain.repository.BoatRepository

class MapViewModelImpl(
    componentContext: ComponentContext,
    private val boatRepository: BoatRepository,
    private val locationProvider: org.dadez.safarban.data.location.LocationProvider
) : MapViewModel, ComponentContext by componentContext {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val _uiState = MutableStateFlow(MapUiState())
    override val uiState: StateFlow<MapUiState> = _uiState

    init {
        load()
        startLocationUpdates()
    }

    override fun load() {
        scope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val boats = boatRepository.getAllBoats()
                val locations = boats.map { b ->
                    org.dadez.safarban.ui.components.maps.LocationItem(
                        id = b.externalId ?: (b.name ?: "unknown"),
                        name = b.name ?: "Unknown",
                        description = b.location ?: b.type ?: "",
                        latitude = b.latitude ?: 0.0,
                        longitude = b.longitude ?: 0.0
                    )
                }
                _uiState.value = _uiState.value.copy(isLoading = false, locations = locations)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    private fun startLocationUpdates() {
        scope.launch {
            locationProvider.locationUpdates().collect { location ->
                _uiState.value = _uiState.value.copy(userLocation = location)
            }
        }
    }

    override fun updateUserLocation(location: org.dadez.safarban.domain.model.UserLocation) {
        _uiState.value = _uiState.value.copy(userLocation = location)
    }
}

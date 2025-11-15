package org.dadez.safarban.ui.screens.boat

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Implementation of BoatComponent
 */
class BoatComponentImpl(
    componentContext: ComponentContext? = null,
    scope: kotlinx.coroutines.CoroutineScope,
    private val boatId: String,
    private val boatName: String,
    private val boatLatitude: Double? = null,
    private val boatLongitude: Double? = null,
    private val boatRepository: org.dadez.safarban.domain.repository.BoatRepository
) : BoatComponent {

    private val _state = MutableStateFlow(
        BoatUiState(
            boatId = boatId,
            boatName = boatName,
            selectedTab = BoatTab.OVERVIEW,
            boatLatitude = boatLatitude,
            boatLongitude = boatLongitude
        )
    )
    override val state: StateFlow<BoatUiState> = _state.asStateFlow()

    private val _locations = kotlinx.coroutines.flow.MutableStateFlow<List<org.dadez.safarban.ui.components.maps.LocationItem>>(emptyList())
    override val locations: StateFlow<List<org.dadez.safarban.ui.components.maps.LocationItem>> = _locations

    init {
        // load default locations from repository
        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Default).launch {
            try {
                val boats = boatRepository.getAllBoats()
                _locations.value = boats.map { b ->
                    org.dadez.safarban.ui.components.maps.LocationItem(
                        id = b.externalId ?: (b.name ?: "unknown"),
                        name = b.name ?: "Unknown",
                        description = b.location ?: b.type ?: "",
                        latitude = b.latitude ?: 0.0,
                        longitude = b.longitude ?: 0.0
                    )
                }
            } catch (_: Throwable) {
                // ignore
            }
        }
    }

    override fun onTabSelected(tab: BoatTab) {
        _state.update { it.copy(selectedTab = tab) }
    }
}

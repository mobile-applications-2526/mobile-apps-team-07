package org.dadez.safarban.ui.screens.boat

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Implementation of BoatComponent
 */
class BoatComponentImpl(
    componentContext: ComponentContext? = null,
    scope: CoroutineScope,
    private val boatId: String,
    private val boatName: String,
    private val boatLatitude: Double? = null,
    private val boatLongitude: Double? = null
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

    override fun onTabSelected(tab: BoatTab) {
        _state.update { it.copy(selectedTab = tab) }
    }
}

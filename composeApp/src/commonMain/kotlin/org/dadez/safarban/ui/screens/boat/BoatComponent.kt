package org.dadez.safarban.ui.screens.boat

import kotlinx.coroutines.flow.StateFlow

/**
 * Public interface for the Boat detail screen component.
 */
interface BoatComponent {
    val state: StateFlow<BoatUiState>

    fun onTabSelected(tab: BoatTab)
}

data class BoatUiState(
    val boatId: String = "",
    val boatName: String = "",
    val selectedTab: BoatTab = BoatTab.OVERVIEW,
    val boatLatitude: Double? = null,
    val boatLongitude: Double? = null
)

enum class BoatTab {
    OVERVIEW,
    OPERATIONS,
    SPECIFICATIONS
}

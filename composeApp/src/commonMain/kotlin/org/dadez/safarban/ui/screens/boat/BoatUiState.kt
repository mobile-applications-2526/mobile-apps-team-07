package org.dadez.safarban.ui.screens.boat

import org.dadez.safarban.domain.model.Boat

data class BoatUiState(
    val boat: Boat? = null,
    val selectedTab: BoatTab = BoatTab.OVERVIEW,
    val isLoading: Boolean = false,
    val error: String? = null
)

enum class BoatTab {
    OVERVIEW, OPERATIONS, SPECIFICATIONS
}

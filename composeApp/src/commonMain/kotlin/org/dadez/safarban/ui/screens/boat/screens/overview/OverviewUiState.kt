package org.dadez.safarban.ui.screens.boat.screens.overview

import org.dadez.safarban.domain.model.Boat

data class OverviewUiState(
    val boat: Boat? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

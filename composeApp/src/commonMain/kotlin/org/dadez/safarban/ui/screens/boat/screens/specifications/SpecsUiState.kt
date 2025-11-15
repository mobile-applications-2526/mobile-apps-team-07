package org.dadez.safarban.ui.screens.boat.screens.specifications

import org.dadez.safarban.domain.model.Boat

data class SpecsUiState(
    val boat: Boat? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

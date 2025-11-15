package org.dadez.safarban.ui.screens.boat.screens.operations

import org.dadez.safarban.domain.model.Boat

data class OperationsUiState(
    val boat: Boat? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

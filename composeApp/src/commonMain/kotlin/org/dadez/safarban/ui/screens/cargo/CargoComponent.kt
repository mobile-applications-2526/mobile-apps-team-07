package org.dadez.safarban.ui.screens.cargo

import kotlinx.coroutines.flow.StateFlow

interface CargoComponent {
    val uiState: StateFlow<CargoUiState>

    fun load()
}

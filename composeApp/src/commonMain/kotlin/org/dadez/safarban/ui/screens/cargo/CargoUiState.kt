package org.dadez.safarban.ui.screens.cargo

data class CargoUiState(
    val title: String = "Cargo",
    val isLoading: Boolean = false,
    val items: List<String> = emptyList(),
    val error: String? = null
)


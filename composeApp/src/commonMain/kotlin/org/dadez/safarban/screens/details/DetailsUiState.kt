package org.dadez.safarban.screens.details

/**
 * Immutable UI state for the Details screen.
 */
data class DetailsUiState(
    val id: String = "",
    val title: String = "Details",
    val description: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)


package org.dadez.safarban.ui.screens.home

/**
 * Immutable UI state for the Home screen.
 * Keep this simple and serializable-friendly so it can be used across platforms.
 */
data class HomeUiState(
    val title: String = "Home",
    val items: List<String> = emptyList<String>(),
    // boats to display on home screen
    val boats: List<org.dadez.safarban.ui.components.boat.BoatCardData> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

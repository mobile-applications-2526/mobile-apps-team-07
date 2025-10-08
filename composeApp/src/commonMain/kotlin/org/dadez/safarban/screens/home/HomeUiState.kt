package org.dadez.safarban.screens.home

/**
 * Immutable UI state for the Home screen.
 * Keep this simple and serializable-friendly so it can be used across platforms.
 */
data class HomeUiState(
    val title: String = "Home",
    val items: List<String> = kotlin.collections.emptyList<String>(),
    val isLoading: Boolean = false,
    val error: String? = null
)

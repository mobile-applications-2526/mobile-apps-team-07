package org.dadez.safarban.ui.screens.home

import kotlinx.coroutines.flow.StateFlow

/**
 * Public interface for the Home screen component.
 * Exposes a StateFlow for UI state and lightweight user actions.
 */
interface HomeComponent {
    val state: StateFlow<HomeUiState>

    fun onRefresh()
    fun onSelect(index: Int)
}

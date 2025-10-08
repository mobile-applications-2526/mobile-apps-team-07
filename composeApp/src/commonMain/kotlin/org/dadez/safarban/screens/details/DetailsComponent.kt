package org.dadez.safarban.screens.details

import kotlinx.coroutines.flow.StateFlow

interface DetailsComponent {
    val state: StateFlow<DetailsUiState>

    fun onRefresh()
}

package org.dadez.safarban.ui.screens.boat.screens.overview

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.dadez.safarban.ui.screens.boat.BoatUiState

class OverviewViewModel(
    componentContext: ComponentContext,
    private val boatUiStateFlow: StateFlow<BoatUiState>,
    private val scope: CoroutineScope
) : ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(OverviewUiState())
    val uiState: StateFlow<OverviewUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        scope.launch {
            boatUiStateFlow.collect { boatUiState ->
                _uiState.value = _uiState.value.copy(boat = boatUiState.boat)
            }
        }
    }
}

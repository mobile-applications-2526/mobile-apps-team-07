package org.dadez.safarban.ui.screens.boat.screens.specifications

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.dadez.safarban.ui.screens.boat.BoatUiState

class SpecsViewModel(
    componentContext: ComponentContext,
    private val boatUiStateFlow: StateFlow<BoatUiState>,
    private val scope: CoroutineScope
) : ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(SpecsUiState())
    val uiState: StateFlow<SpecsUiState> = _uiState.asStateFlow()

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

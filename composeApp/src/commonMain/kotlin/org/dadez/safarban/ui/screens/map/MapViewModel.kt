package org.dadez.safarban.ui.screens.map

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MapViewModel(
    private val scope: CoroutineScope
) {
    private val _state = MutableStateFlow(MapUiState())
    val state: StateFlow<MapUiState> = _state

    fun load() {
        scope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                delay(300)
                _state.value = _state.value.copy(isLoading = false)
            } catch (t: Throwable) {
                _state.value = _state.value.copy(isLoading = false)
            }
        }
    }
}

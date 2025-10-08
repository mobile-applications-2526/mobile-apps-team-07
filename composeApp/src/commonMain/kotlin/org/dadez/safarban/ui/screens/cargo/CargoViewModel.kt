package org.dadez.safarban.ui.screens.cargo

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class CargoViewModel(
    private val scope: CoroutineScope
) {
    private val _state = MutableStateFlow(CargoUiState())
    val state: StateFlow<CargoUiState> = _state

    fun load() {
        scope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                delay(400)
                // fake items
                val items = listOf("Package A", "Package B")
                _state.value = _state.value.copy(items = items, isLoading = false)
            } catch (t: Throwable) {
                _state.value = _state.value.copy(isLoading = false, error = t.message)
            }
        }
    }

    fun refresh() {
        load()
    }
}


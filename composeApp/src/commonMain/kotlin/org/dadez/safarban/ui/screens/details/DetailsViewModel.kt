package org.dadez.safarban.ui.screens.details

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/**
 * Simple multiplatform ViewModel for Details screen.
 */
class DetailsViewModel(
    private val scope: CoroutineScope,
    private val id: String
) {
    private val _state = MutableStateFlow(DetailsUiState(id = id))
    val state: StateFlow<DetailsUiState> = _state

    fun loadDetails() {
        scope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                // simulate load
                delay(300)
                _state.value = _state.value.copy(title = "Item $id", description = "Description for item $id", isLoading = false)
            } catch (t: Throwable) {
                _state.value = _state.value.copy(isLoading = false, error = t.message)
            }
        }
    }

    fun refresh() {
        loadDetails()
    }
}


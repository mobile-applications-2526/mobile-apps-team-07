package org.dadez.safarban.ui.screens.home

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/**
 * Pure multiplatform ViewModel (not tied to Android ViewModel) that follows MVVM.
 * - Accepts a CoroutineScope from the caller so lifecycle is managed by the platform/component owner.
 * - Exposes immutable StateFlow for the UI/state holder to observe.
 */
class HomeViewModel(
    private val scope: CoroutineScope,
    private val getAllBoatsUseCase: org.dadez.safarban.domain.usecase.GetAllBoatsUseCase
) {
    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state

    fun loadItems() {
        scope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            // Simulate network/db load
            try {
                delay(200)

                try {
                    val boats = getAllBoatsUseCase()
                    val mapped = boats.map { domainBoat ->
                        org.dadez.safarban.ui.components.boat.BoatCardData(
                            id = domainBoat.externalId ?: (domainBoat.name ?: "unknown"),
                            name = domainBoat.name ?: "Unknown",
                            type = domainBoat.type ?: "Unknown",
                            location = domainBoat.location ?: "Unknown",
                            status = domainBoat.status ?: "Unknown",
                            latitude = domainBoat.latitude,
                            longitude = domainBoat.longitude
                        )
                    }

                    _state.value = _state.value.copy(boats = mapped, isLoading = false)
                    return@launch
                } catch (_: Throwable) {
                    _state.value = _state.value.copy(boats = emptyList(), isLoading = false)
                }
            } catch (t: Throwable) {
                _state.value = _state.value.copy(isLoading = false, error = t.message)
            }
        }
    }

    fun refresh() {
        loadItems()
    }

    fun selectItem(index: Int) {
        // In a real app, we might navigate to a details screen - expose an event or callback instead
        val item = if (index >= 0 && index < _state.value.items.size) _state.value.items[index] else null
        _state.value = _state.value.copy(title = item ?: "Home")
    }
}

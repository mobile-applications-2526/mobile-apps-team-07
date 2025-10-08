package org.dadez.safarban.screens.settings

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsComponentImpl(
    componentContext: ComponentContext,
    private val scope: CoroutineScope
) : SettingsComponent, ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(SettingsUiState())
    override val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    override fun toggleDarkMode() {
        scope.launch {
            _uiState.value = _uiState.value.copy(
                isDarkMode = !_uiState.value.isDarkMode
            )
        }
    }

    override fun toggleNotifications() {
        scope.launch {
            _uiState.value = _uiState.value.copy(
                notificationsEnabled = !_uiState.value.notificationsEnabled
            )
        }
    }

    override fun clearCache() {
        scope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            // Simulate cache clearing
            kotlinx.coroutines.delay(1000)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                cacheSize = "0 MB"
            )
        }
    }
}

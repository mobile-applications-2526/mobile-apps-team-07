package org.dadez.safarban.ui.screens.settings

import kotlinx.coroutines.flow.StateFlow

interface SettingsComponent {
    val uiState: StateFlow<SettingsUiState>

    fun toggleDarkMode()
    fun toggleNotifications()
    fun clearCache()
}

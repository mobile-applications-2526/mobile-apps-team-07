package org.dadez.safarban.ui.screens.settings

data class SettingsUiState(
    val isDarkMode: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val cacheSize: String = "0 MB",
    val isLoading: Boolean = false
)

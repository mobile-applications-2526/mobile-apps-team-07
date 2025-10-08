package org.dadez.safarban.screens.settings

data class SettingsUiState(
    val isDarkMode: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val cacheSize: String = "0 MB",
    val isLoading: Boolean = false
)

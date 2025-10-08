package org.dadez.safarban.screens.profile

data class ProfileUiState(
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val avatarUrl: String = "",
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val errorMessage: String? = null
)

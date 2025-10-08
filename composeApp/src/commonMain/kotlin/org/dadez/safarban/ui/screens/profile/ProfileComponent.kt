package org.dadez.safarban.ui.screens.profile

import kotlinx.coroutines.flow.StateFlow

interface ProfileComponent {
    val uiState: StateFlow<ProfileUiState>

    fun loadProfile()
    fun updateName(name: String)
    fun updateEmail(email: String)
    fun saveProfile()
}

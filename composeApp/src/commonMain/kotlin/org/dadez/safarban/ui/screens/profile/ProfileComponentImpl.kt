package org.dadez.safarban.ui.screens.profile

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProfileComponentImpl(
    componentContext: ComponentContext,
    private val scope: CoroutineScope,
    private val userId: String
) : ProfileComponent, ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(ProfileUiState(userId = userId))
    override val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    override fun loadProfile() {
        scope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Simulate loading profile data
            delay(1000)

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                name = "John Doe",
                email = "john.doe@example.com",
                avatarUrl = "https://via.placeholder.com/150"
            )
        }
    }

    override fun updateName(name: String) {
        _uiState.value = _uiState.value.copy(name = name)
    }

    override fun updateEmail(email: String) {
        _uiState.value = _uiState.value.copy(email = email)
    }

    override fun saveProfile() {
        scope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, errorMessage = null)

            // Simulate saving profile
            delay(1500)

            // Simulate success/failure
            if (_uiState.value.name.isNotBlank() && _uiState.value.email.isNotBlank()) {
                _uiState.value = _uiState.value.copy(isSaving = false)
            } else {
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    errorMessage = "Name and email cannot be empty"
                )
            }
        }
    }
}

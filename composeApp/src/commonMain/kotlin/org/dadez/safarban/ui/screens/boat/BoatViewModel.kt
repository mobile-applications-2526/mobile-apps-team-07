package org.dadez.safarban.ui.screens.boat

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.dadez.safarban.domain.repository.BoatRepository
import org.dadez.safarban.domain.usecase.GetUserByIdUseCase

class BoatViewModel(
    componentContext: ComponentContext,
    private val boatId: Long,
    private val getUserByIdUseCase: GetUserByIdUseCase,
    private val boatRepository: BoatRepository,
    private val scope: CoroutineScope,
) : ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(BoatUiState())
    val uiState: StateFlow<BoatUiState> = _uiState

    init {
        println("BoatViewModel: init called for boatId=$boatId")
        loadBoatDetails()
    }

    private fun loadBoatDetails() {
        println("BoatViewModel: loadBoatDetails called")
        scope.launch {
            println("BoatViewModel: coroutine started")
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                println("BoatViewModel: fetching boat with id=$boatId")
                val boat = boatRepository.getBoatById(boatId)
                println("BoatViewModel: boat fetched successfully: $boat")
                _uiState.value = _uiState.value.copy(isLoading = false, boat = boat)
            } catch (e: Exception) {
                println("BoatViewModel: error fetching boat: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun selectTab(tab: BoatTab) {
        _uiState.value = _uiState.value.copy(selectedTab = tab)
    }
}

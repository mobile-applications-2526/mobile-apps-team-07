package org.dadez.safarban.ui.screens.boat.screens.operations

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.StateFlow
import org.dadez.safarban.ui.screens.boat.BoatUiState

class OperationsComponentImpl(
    componentContext: ComponentContext,
    private val boatUiState: StateFlow<BoatUiState>,
    private val onBack: () -> Unit
) : OperationsComponent, ComponentContext by componentContext {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    override val viewModel: OperationsViewModel = OperationsViewModel(componentContext, boatUiState, scope)

    override fun onBackClicked() {
        onBack()
    }
}

package org.dadez.safarban.ui.screens.boat.screens.specifications

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.StateFlow
import org.dadez.safarban.ui.screens.boat.BoatUiState

class SpecsComponentImpl(
    componentContext: ComponentContext,
    private val boatUiState: StateFlow<BoatUiState>,
    private val onBack: () -> Unit
) : SpecsComponent, ComponentContext by componentContext {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    override val viewModel: SpecsViewModel = SpecsViewModel(componentContext, boatUiState, scope)

    override fun onBackClicked() {
        onBack()
    }
}

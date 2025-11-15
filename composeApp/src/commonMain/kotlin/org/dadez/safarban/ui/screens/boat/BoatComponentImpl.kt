package org.dadez.safarban.ui.screens.boat

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.StateFlow
import org.dadez.safarban.domain.repository.BoatRepository
import org.dadez.safarban.domain.usecase.GetUserByIdUseCase
import org.dadez.safarban.ui.screens.boat.screens.operations.OperationsComponent
import org.dadez.safarban.ui.screens.boat.screens.operations.OperationsComponentImpl
import org.dadez.safarban.ui.screens.boat.screens.overview.OverviewComponent
import org.dadez.safarban.ui.screens.boat.screens.overview.OverviewComponentImpl
import org.dadez.safarban.ui.screens.boat.screens.specifications.SpecsComponent
import org.dadez.safarban.ui.screens.boat.screens.specifications.SpecsComponentImpl

/**
 * Implementation of BoatComponent
 */
class BoatComponentImpl(
    componentContext: ComponentContext,
    private val boatId: Long,
    getUserByIdUseCase: GetUserByIdUseCase,
    private val boatRepository: BoatRepository,
    private val scope: CoroutineScope,
    private val onBack: () -> Unit
) : BoatComponent, ComponentContext by componentContext {

    private val viewModel = BoatViewModel(componentContext, boatId, getUserByIdUseCase, boatRepository, scope)

    override val uiState: StateFlow<BoatUiState> = viewModel.uiState

    override fun selectTab(tab: BoatTab) = viewModel.selectTab(tab)

    override val overviewComponent: OverviewComponent =
        OverviewComponentImpl(componentContext, viewModel.uiState) { onBack() }
    override val operationsComponent: OperationsComponent =
        OperationsComponentImpl(componentContext, viewModel.uiState) { onBack() }
    override val specsComponent: SpecsComponent =
        SpecsComponentImpl(componentContext, viewModel.uiState) { onBack() }
}

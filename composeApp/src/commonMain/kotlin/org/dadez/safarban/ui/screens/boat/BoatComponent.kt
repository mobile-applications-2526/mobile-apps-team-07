package org.dadez.safarban.ui.screens.boat

import kotlinx.coroutines.flow.StateFlow
import org.dadez.safarban.ui.screens.boat.screens.operations.OperationsComponent
import org.dadez.safarban.ui.screens.boat.screens.overview.OverviewComponent
import org.dadez.safarban.ui.screens.boat.screens.specifications.SpecsComponent

/**
 * Public interface for the Boat detail screen component.
 */
interface BoatComponent {
    val uiState: StateFlow<BoatUiState>
    fun selectTab(tab: BoatTab)
    val overviewComponent: OverviewComponent
    val operationsComponent: OperationsComponent
    val specsComponent: SpecsComponent
}

package org.dadez.safarban.ui.screens.cargo

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope

class CargoComponentImpl(
    componentContext: ComponentContext,
    private val scope: CoroutineScope
) : CargoComponent, ComponentContext by componentContext {

    private val viewModel = CargoViewModel(scope)

    override val uiState = viewModel.state

    init {
        viewModel.load()
    }

    override fun load() {
        viewModel.load()
    }
}

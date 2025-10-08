package org.dadez.safarban.ui.screens.map

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope

// Use ViewModel for Map state
class MapComponentImpl(
    componentContext: ComponentContext,
    private val scope: CoroutineScope
) : MapComponent, ComponentContext by componentContext {

    private val viewModel = MapViewModel(scope)

    override val uiState = viewModel.state

    init {
        viewModel.load()
    }

    override fun load() {
        viewModel.load()
    }
}

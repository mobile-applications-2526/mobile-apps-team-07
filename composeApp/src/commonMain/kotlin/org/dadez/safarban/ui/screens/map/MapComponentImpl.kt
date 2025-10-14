package org.dadez.safarban.ui.screens.map

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class MapComponentImpl(
    componentContext: ComponentContext,
) : MapComponent, ComponentContext by componentContext {

    override val uiState: StateFlow<MapUiState> = MutableStateFlow(MapUiState())

    override fun load() {
        // No-op
    }
}

package org.dadez.safarban.ui.screens.home

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope

/**
 * Decompose-compatible implementation of [HomeComponent].
 * - Receives a CoroutineScope from the host (usually derived from ComponentContext)
 * - Owns a ViewModel and exposes its state as a StateFlow
 */
class HomeComponentImpl(
    componentContext: ComponentContext? = null,
    private val scope: CoroutineScope,
) : HomeComponent {

    // keep a reference to the component context so the parameter is used if provided
    private val componentContextRef: ComponentContext? = componentContext

    private val viewModel = HomeViewModel(scope)

    // Expose the ViewModel's StateFlow directly
    override val state = viewModel.state

    init {
        // Kick off initial load
        viewModel.loadItems()
    }

    override fun onRefresh() {
        viewModel.refresh()
    }

    override fun onSelect(index: Int) {
        viewModel.selectItem(index)
    }
}

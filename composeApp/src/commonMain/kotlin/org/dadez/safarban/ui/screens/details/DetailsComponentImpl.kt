package org.dadez.safarban.ui.screens.details

import com.arkivanov.decompose.ComponentContext
import kotlinx.coroutines.CoroutineScope

class DetailsComponentImpl(
    componentContext: ComponentContext? = null,
    private val scope: CoroutineScope,
    private val id: String
) : DetailsComponent {

    // keep reference to the context so the parameter is used if provided
    private val componentContextRef: ComponentContext? = componentContext

    private val viewModel = DetailsViewModel(scope = scope, id = id)

    // Expose the ViewModel StateFlow directly
    override val state = viewModel.state

    init {
        viewModel.loadDetails()
    }

    override fun onRefresh() {
        viewModel.refresh()
    }
}

package org.dadez.safarban

import androidx.compose.ui.window.ComposeUIViewController
import com.arkivanov.decompose.DefaultComponentContext
import com.arkivanov.essenty.lifecycle.LifecycleRegistry
import org.dadez.safarban.ui.navigation.RootComponent
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.launch

private var rootComponentInstance: RootComponent? = null

@Suppress("unused") // Called from iOS platform
fun MainViewController() = ComposeUIViewController {
    val lifecycle = LifecycleRegistry()

    // Initializing dependency injection
    org.dadez.safarban.di.initKoinIOS()

    // Seed canonical boats if needed (best-effort on a background coroutine)
    try {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val boatRepository: org.dadez.safarban.domain.repository.BoatRepository = org.koin.core.context.GlobalContext.get().get()
                org.dadez.safarban.data.db.seedDefaultBoatsIfEmpty(boatRepository)
            } catch (_: Throwable) {
                // ignore
            }
        }
    } catch (_: Throwable) {
        // ignore: if coroutines dispatchers aren't available, skip seeding
    }

    val componentContext = DefaultComponentContext(lifecycle)

    // Resolve domain dependencies from Koin and pass into RootComponent
    val getAllBoatsUseCase: org.dadez.safarban.domain.usecase.GetAllBoatsUseCase = org.koin.core.context.GlobalContext.get().get()
    val getUserByIdUseCase: org.dadez.safarban.domain.usecase.GetUserByIdUseCase = org.koin.core.context.GlobalContext.get().get()
    val boatRepo: org.dadez.safarban.domain.repository.BoatRepository = org.koin.core.context.GlobalContext.get().get()

    val rootComponent = RootComponent(componentContext, getAllBoatsUseCase, getUserByIdUseCase, boatRepo)
    rootComponentInstance = rootComponent
    // Pass the single RootComponent instance into RootApp to avoid duplicate registration
    IOSRootAppWithResponsiveHeights(rootComponent)
}

@Composable
private fun IOSRootAppWithResponsiveHeights(rootComponent: RootComponent) {
    val configuration = LocalConfiguration.current
    val screenHeightDp = configuration.screenHeightDp.dp

    val maxFraction = 0.8f
    val minFraction = 0.25f

    val maxSheetHeight = screenHeightDp * maxFraction
    val minSheetHeight = maxOf(screenHeightDp * minFraction, 90.dp)
    val initialSheetHeight = minSheetHeight

    RootApp(rootComponent, maxSheetHeight = maxSheetHeight, minSheetHeight = minSheetHeight, initialSheetHeight = initialSheetHeight)
}

/**
 * Handle deep links from iOS
 * Call this from your iOS app delegate when handling URL schemes
 */
@Suppress("unused") // Called from iOS platform
fun handleiOSDeepLink(url: String) {
    rootComponentInstance?.let { rootComponent ->
        when {
            url.contains("/home") -> rootComponent.handleDeepLink(RootComponent.DeepLink.Home)
            url.contains("/details") -> {
                val id = extractQueryParameter(url, "id") ?: "unknown"
                rootComponent.handleDeepLink(RootComponent.DeepLink.Details(id))
            }
            url.contains("/settings") -> rootComponent.handleDeepLink(RootComponent.DeepLink.Settings)
            url.contains("/profile") -> {
                val userId = extractQueryParameter(url, "userId") ?: "unknown"
                rootComponent.handleDeepLink(RootComponent.DeepLink.Profile(userId))
            }
        }
    }
}

private fun extractQueryParameter(url: String, parameter: String): String? {
    return try {
        val regex = "${parameter}=([^&]*)".toRegex()
        regex.find(url)?.groupValues?.get(1)
    } catch (_: Exception) {
        null
    }
}

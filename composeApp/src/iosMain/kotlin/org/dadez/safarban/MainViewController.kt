package org.dadez.safarban

import androidx.compose.ui.window.ComposeUIViewController
import com.arkivanov.decompose.DefaultComponentContext
import com.arkivanov.essenty.lifecycle.LifecycleRegistry
import org.dadez.safarban.ui.navigation.RootComponent

private var rootComponentInstance: RootComponent? = null

@Suppress("unused") // Called from iOS platform
fun MainViewController() = ComposeUIViewController {
    val lifecycle = LifecycleRegistry()
    // Initialize Koin for iOS (provide DriverFactory and database via iosModule)
    org.dadez.safarban.di.initKoinIOS()

    // Seed canonical boats if needed (best-effort on a background coroutine)
    try {
        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Default).launch {
            try {
                val database: org.dadez.safarban.database.SafarbanDatabase = org.koin.core.context.GlobalContext.get().get()
                org.dadez.safarban.data.db.seedDefaultBoatsIfEmpty(database)
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
    val boatRepo: org.dadez.safarban.domain.repository.BoatRepository = org.koin.core.context.GlobalContext.get().get()

    val rootComponent = RootComponent(componentContext, getAllBoatsUseCase, boatRepo)
    rootComponentInstance = rootComponent
    // Pass the single RootComponent instance into RootApp to avoid duplicate registration
    RootApp(rootComponent)
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

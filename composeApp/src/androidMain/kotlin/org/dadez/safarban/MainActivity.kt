package org.dadez.safarban

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.addCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.ui.graphics.toArgb
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import com.arkivanov.decompose.DefaultComponentContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.dadez.safarban.ui.navigation.RootComponent

class MainActivity : ComponentActivity() {
    private lateinit var rootComponent: RootComponent

    override fun onCreate(savedInstanceState: Bundle?) {
        // Ocean blue color for status bar
        val oceanBlue = androidx.compose.ui.graphics.Color(0xFF006994).toArgb()

        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(oceanBlue)
        )
        super.onCreate(savedInstanceState)

        // Ensure status bar icons are light colored
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
        }

        // Initialize Koin and platform DI (provides DriverFactory and database)
        org.dadez.safarban.di.initKoinAndroid(this.applicationContext)

        // Seed the DB if needed (this is a suspend call, launched in the IO scope)
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val boatRepository: org.dadez.safarban.domain.repository.BoatRepository = org.koin.core.context.GlobalContext.get().get()
                org.dadez.safarban.data.db.seedDefaultBoatsIfEmpty(boatRepository)
            } catch (_: Throwable) {
                // swallow; seeding is best-effort for now
            }
        }

    // Create a Decompose ComponentContext backed by the Android lifecycle
    val componentContext = DefaultComponentContext(lifecycle)

    // Resolve required domain dependencies from Koin and pass into RootComponent
    val getAllBoatsUseCase: org.dadez.safarban.domain.usecase.GetAllBoatsUseCase = org.koin.core.context.GlobalContext.get().get()
    val getUserByIdUseCase: org.dadez.safarban.domain.usecase.GetUserByIdUseCase = org.koin.core.context.GlobalContext.get().get()
    val boatRepo: org.dadez.safarban.domain.repository.BoatRepository = org.koin.core.context.GlobalContext.get().get()

    rootComponent = RootComponent(componentContext, getAllBoatsUseCase, getUserByIdUseCase, boatRepo)

        // Register a back callback that delegates to the RootComponent
        onBackPressedDispatcher.addCallback(this) {
            val handled = if (::rootComponent.isInitialized) rootComponent.navigateBack() else false
            if (!handled) {
                // At root: move task to background to preserve state (like Home button)
                moveTaskToBack(true)
            }
        }

        // Handle deep links from intent
        handleIntent(intent)

        setContent {
            // Pass the single RootComponent instance into RootApp
            RootApp(rootComponent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        intent.data?.let { uri ->
            handleDeepLink(uri)
        }
    }

    private fun handleDeepLink(uri: Uri) {
        when (uri.path) {
            "/home" -> rootComponent.handleDeepLink(RootComponent.DeepLink.Home)
            "/details" -> {
                val id = uri.getQueryParameter("id") ?: "unknown"
                rootComponent.handleDeepLink(RootComponent.DeepLink.Details(id))
            }
            "/settings" -> rootComponent.handleDeepLink(RootComponent.DeepLink.Settings)
            "/profile" -> {
                val userId = uri.getQueryParameter("userId") ?: "unknown"
                rootComponent.handleDeepLink(RootComponent.DeepLink.Profile(userId))
            }
        }
    }
}

package org.dadez.safarban

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.addCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
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

        // Seed the DB if needed (this is a suspend call, launched in IO dispatcher)
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val dbPath = applicationContext.getDatabasePath("safarban.db").absolutePath
                println("MainActivity: DB path = $dbPath")
                println("MainActivity: starting DB seeding check on device (IO)")
                val boatRepository: org.dadez.safarban.domain.repository.BoatRepository = org.koin.core.context.GlobalContext.get().get()
                org.dadez.safarban.data.db.seedDefaultBoatsIfEmpty(boatRepository)
                println("MainActivity: DB seeding task completed")
            } catch (e: Throwable) {
                println("MainActivity: DB seeding task failed: ${e.message}")
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
            // We need to compute responsive sheet heights based on screen height for Android
            AndroidRootAppWithResponsiveHeights(rootComponent)
        }
    }

    @Composable
    private fun AndroidRootAppWithResponsiveHeights(rootComponent: RootComponent) {
        // Read screen height in dp
        val configuration = LocalConfiguration.current
        val screenHeightDp = configuration.screenHeightDp.dp

        // Floating search bar metrics (match MapScreen search bar padding/height)
        val searchBarTopPadding = 64.dp
        val searchBarHeight = 48.dp
        val searchBarVerticalSpace = searchBarTopPadding + searchBarHeight + 8.dp // extra margin

        // Fractions
        val maxFraction = 0.8f
        val minFraction = 0.25f
        val initialFraction = minFraction

        // Base fraction sizes
        val fractionMax = screenHeightDp * maxFraction
        val fractionMin = screenHeightDp * minFraction
        val fractionInitial = screenHeightDp * initialFraction

        // Ensure max sheet height doesn't overlap the floating search bar
        val maxSheetHeight: Dp = if (fractionMax > (screenHeightDp - searchBarVerticalSpace)) {
            (screenHeightDp - searchBarVerticalSpace)
        } else fractionMax

        // Collapsed / minimum height should be at least one card height (~90.dp) but derived from fraction otherwise
        val minCardHeight = 90.dp
        val minSheetHeight: Dp = maxOf(fractionMin, minCardHeight)

        // Use minSheetHeight for initial so the sheet initially shows at least one card
        RootApp(
            rootComponent = rootComponent,
            maxSheetHeight = maxSheetHeight,
            minSheetHeight = minSheetHeight,
            // allow BottomSheet to compute collapsed initial height by not passing an explicit initial
            initialSheetHeight = null
        )
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

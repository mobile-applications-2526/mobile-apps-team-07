package org.dadez.safarban

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.arkivanov.decompose.DefaultComponentContext
import org.dadez.safarban.navigation.RootComponent

class MainActivity : ComponentActivity() {
    private lateinit var rootComponent: RootComponent

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Create a Decompose ComponentContext backed by the Android lifecycle
        val componentContext = DefaultComponentContext(lifecycle)
        rootComponent = RootComponent(componentContext)

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

@Preview
@Composable
fun AppAndroidPreview() {
    // Use the no-arg App() for preview
    App()
}
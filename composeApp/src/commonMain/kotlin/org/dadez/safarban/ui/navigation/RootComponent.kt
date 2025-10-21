package org.dadez.safarban.ui.navigation

import com.arkivanov.decompose.ComponentContext
import com.arkivanov.decompose.router.stack.ChildStack
import com.arkivanov.decompose.router.stack.StackNavigation
import com.arkivanov.decompose.router.stack.bringToFront
import com.arkivanov.decompose.router.stack.childStack
import com.arkivanov.decompose.router.stack.pushNew
import com.arkivanov.decompose.value.Value
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.Serializable
import org.dadez.safarban.ui.screens.details.DetailsComponent
import org.dadez.safarban.ui.screens.details.DetailsComponentImpl
import org.dadez.safarban.ui.screens.home.HomeComponent
import org.dadez.safarban.ui.screens.home.HomeComponentImpl
import org.dadez.safarban.ui.screens.profile.ProfileComponent
import org.dadez.safarban.ui.screens.profile.ProfileComponentImpl
import org.dadez.safarban.ui.screens.settings.SettingsComponent
import org.dadez.safarban.ui.screens.settings.SettingsComponentImpl

class RootComponent(
    componentContext: ComponentContext
) : ComponentContext by componentContext {

    private val navigation = StackNavigation<Config>()

    // Maintain an explicit user navigation history so system back can traverse every
    // step the user took (including bringToFront bottom-nav actions).
    private val history = mutableListOf<Config>(Config.Home)

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    val routerState: Value<ChildStack<*, Child>> = childStack(
        source = navigation,
        serializer = Config.serializer(),
        initialConfiguration = Config.Home,
        handleBackButton = true,
        childFactory = ::createChild
    )

    private fun createChild(config: Config, componentContext: ComponentContext): Child =
        when (config) {
            is Config.Home -> Child.HomeChild(
                HomeComponentImpl(
                    componentContext = componentContext,
                    scope = scope
                )
            )
            is Config.Details -> Child.DetailsChild(
                DetailsComponentImpl(
                    componentContext = componentContext,
                    scope = scope,
                    id = config.id
                )
            )
            is Config.Settings -> Child.SettingsChild(
                SettingsComponentImpl(
                    componentContext = componentContext,
                    scope = scope
                )
            )
            is Config.Profile -> Child.ProfileChild(
                ProfileComponentImpl(
                    componentContext = componentContext,
                    scope = scope,
                    userId = config.userId
                )
            )
            is Config.Map -> Child.MapChild(
                org.dadez.safarban.ui.screens.map.MapComponentImpl(
                    componentContext = componentContext
                )
            )
            is Config.Cargo -> Child.CargoChild(
                org.dadez.safarban.ui.screens.cargo.CargoComponentImpl(
                    componentContext = componentContext,
                    scope = scope
                )
            )
        }

    /**
     * Navigate to home screen (adds to history)
     */
    fun navigateToHome() {
        navigation.bringToFront(Config.Home)
        if (history.lastOrNull() != Config.Home) history.add(Config.Home)
    }

    /**
     * Navigate to details screen (pushes new screen to back stack and records history)
     */
    fun navigateToDetails(id: String) {
        val cfg = Config.Details(id)
        navigation.pushNew(cfg)
        if (history.lastOrNull() != cfg) history.add(cfg)
    }

    /**
     * Navigate to settings screen (brings to front for bottom nav and records history)
     */
    fun navigateToSettings() {
        navigation.bringToFront(Config.Settings)
        if (history.lastOrNull() != Config.Settings) history.add(Config.Settings)
    }

    /**
     * Navigate to profile screen (brings to front for bottom nav and records history)
     */
    fun navigateToProfile(userId: String) {
        val cfg = Config.Profile(userId)
        navigation.bringToFront(cfg)
        if (history.lastOrNull() != cfg) history.add(cfg)
    }

    /**
     * Navigate to map screen (brings to front for bottom nav and records history)
     */
    fun navigateToMap() {
        navigation.bringToFront(Config.Map)
        if (history.lastOrNull() != Config.Map) history.add(Config.Map)
    }

    /**
     * Navigate to cargo screen (brings to front for bottom nav and records history)
     */
    fun navigateToCargo() {
        navigation.bringToFront(Config.Cargo)
        if (history.lastOrNull() != Config.Cargo) history.add(Config.Cargo)
    }

    /**
     * Navigate back in the stack following the user's navigation history.
     * Returns true if handled (we navigated within the app), false if there is no history
     * and the host should handle (e.g. minimize or finish).
     */
    fun navigateBack(): Boolean {
        // If user took previous steps, pop the history and navigate to the previous entry
        if (history.size > 1) {
            // Remove current
            history.removeAt(history.lastIndex)
            // The new last is the previous screen we should show
            val previous = history.last()
            navigation.bringToFront(previous)
            return true
        }

        // nothing to pop; let the host decide (minimize/exit)
        return false
    }

    /**
     * Deep link navigation - handles external navigation requests
     */
    fun handleDeepLink(deepLink: DeepLink) {
        when (deepLink) {
            is DeepLink.Home -> navigateToHome()
            is DeepLink.Details -> navigateToDetails(deepLink.id)
            is DeepLink.Settings -> navigateToSettings()
            is DeepLink.Profile -> navigateToProfile(deepLink.userId)
        }
    }

    /**
     * Deep link data classes for external navigation
     */
    sealed class DeepLink {
        object Home : DeepLink()
        data class Details(val id: String) : DeepLink()
        object Settings : DeepLink()
        data class Profile(val userId: String) : DeepLink()
    }

    @Serializable
    sealed class Config {
        @Serializable
        data object Home : Config()

        @Serializable
        data class Details(val id: String) : Config()

        @Serializable
        data object Settings : Config()

        @Serializable
        data class Profile(val userId: String) : Config()

        @Serializable
        data object Map : Config()

        @Serializable
        data object Cargo : Config()
    }

    sealed class Child {
        data class HomeChild(val component: HomeComponent) : Child()
        data class DetailsChild(val component: DetailsComponent) : Child()
        data class SettingsChild(val component: SettingsComponent) : Child()
        data class ProfileChild(val component: ProfileComponent) : Child()
        data class MapChild(val component: org.dadez.safarban.ui.screens.map.MapComponent) : Child()
        data class CargoChild(val component: org.dadez.safarban.ui.screens.cargo.CargoComponent) : Child()
    }
}
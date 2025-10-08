package org.dadez.safarban.navigation

import com.arkivanov.decompose.ComponentContext
import com.arkivanov.decompose.router.stack.ChildStack
import com.arkivanov.decompose.router.stack.StackNavigation
import com.arkivanov.decompose.router.stack.bringToFront
import com.arkivanov.decompose.router.stack.childStack
import com.arkivanov.decompose.router.stack.pop
import com.arkivanov.decompose.router.stack.pushNew
import com.arkivanov.decompose.value.Value
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.Serializable
import org.dadez.safarban.screens.details.DetailsComponent
import org.dadez.safarban.screens.details.DetailsComponentImpl
import org.dadez.safarban.screens.home.HomeComponent
import org.dadez.safarban.screens.home.HomeComponentImpl
import org.dadez.safarban.screens.settings.SettingsComponent
import org.dadez.safarban.screens.settings.SettingsComponentImpl
import org.dadez.safarban.screens.profile.ProfileComponent
import org.dadez.safarban.screens.profile.ProfileComponentImpl

class RootComponent(
    componentContext: ComponentContext
) : ComponentContext by componentContext {

    private val navigation = StackNavigation<Config>()

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
        }

    /**
     * Navigate to home screen (clears back stack)
     */
    fun navigateToHome() {
        navigation.bringToFront(Config.Home)
    }

    /**
     * Navigate to details screen (pushes new screen to back stack)
     */
    fun navigateToDetails(id: String) {
        navigation.pushNew(Config.Details(id))
    }

    /**
     * Navigate to settings screen (pushes new screen to back stack)
     */
    fun navigateToSettings() {
        navigation.pushNew(Config.Settings)
    }

    /**
     * Navigate to profile screen (pushes new screen to back stack)
     */
    fun navigateToProfile(userId: String) {
        navigation.pushNew(Config.Profile(userId))
    }

    /**
     * Navigate back in the stack
     */
    fun navigateBack(): Boolean {
        navigation.pop()
        return true
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
    }

    sealed class Child {
        data class HomeChild(val component: HomeComponent) : Child()
        data class DetailsChild(val component: DetailsComponent) : Child()
        data class SettingsChild(val component: SettingsComponent) : Child()
        data class ProfileChild(val component: ProfileComponent) : Child()
    }
}

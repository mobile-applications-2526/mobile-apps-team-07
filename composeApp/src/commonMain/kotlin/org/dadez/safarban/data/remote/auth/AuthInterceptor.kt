package org.dadez.safarban.data.remote.auth

import io.ktor.client.plugins.api.createClientPlugin
import io.ktor.client.request.header

/**
 * Ktor plugin that adds Authorization header when a token is available.
 * This is the multiplatform-compatible replacement for OkHttp's Interceptor.
 */
val AuthPlugin = createClientPlugin("AuthPlugin", ::AuthPluginConfig) {
    val tokenProvider = pluginConfig.tokenProvider

    onRequest { request, _ ->
        // Add Accept header
        request.header("Accept", "application/json")

        // Try to get and add auth token
        val token = try {
            tokenProvider.getToken()
        } catch (t: Throwable) {
            null
        }

        token?.let {
            request.header("Authorization", "Bearer $it")
        }
    }
}

class AuthPluginConfig {
    lateinit var tokenProvider: AuthTokenProvider
}

package org.dadez.safarban

import androidx.compose.runtime.Composable
import org.dadez.safarban.data.location.LocationProvider

expect class Platform() {
    val name: String
}

expect fun getPlatform(): Platform

@Composable
expect fun rememberPlatformContext(): Any

@Composable
expect fun rememberLocationProvider(): LocationProvider

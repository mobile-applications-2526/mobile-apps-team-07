package org.dadez.safarban

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import org.dadez.safarban.data.location.LocationProvider
import org.dadez.safarban.data.location.LocationProviderImpl
import platform.UIKit.UIDevice

actual class Platform actual constructor() {
    actual val name: String = UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
}

actual fun getPlatform(): Platform = Platform()

@Composable
actual fun rememberPlatformContext(): Any {
    // iOS doesn't need a context like Android, return Unit or a placeholder
    return remember { Unit }
}

@Composable
actual fun rememberLocationProvider(): LocationProvider {
    return remember { LocationProviderImpl() }
}

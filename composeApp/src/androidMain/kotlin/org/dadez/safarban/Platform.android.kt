package org.dadez.safarban

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import com.google.android.gms.location.LocationServices
import org.dadez.safarban.data.location.LocationProvider
import org.dadez.safarban.data.location.LocationProviderImpl
import org.koin.compose.koinInject

actual class Platform actual constructor() {
    actual val name: String = "Android"
}

actual fun getPlatform(): Platform = Platform()

@Composable
actual fun rememberPlatformContext(): Any {
    return koinInject<Context>()
}

@Composable
actual fun rememberLocationProvider(): LocationProvider {
    val context = koinInject<Context>()
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    return remember { LocationProviderImpl(fusedLocationClient) }
}

package org.dadez.safarban.ui.screens.map

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.google.android.gms.location.LocationServices
import org.dadez.safarban.data.location.LocationProvider
import org.dadez.safarban.data.location.LocationProviderImpl

/**
 * Android implementation to get platform context
 */
@Composable
actual fun rememberPlatformContext(): Any {
    return LocalContext.current
}

/**
 * Android implementation to get LocationProvider with FusedLocationProviderClient
 */
@Composable
actual fun rememberLocationProvider(): LocationProvider {
    val context = LocalContext.current
    return remember {
        val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context as Context)
        LocationProviderImpl(fusedLocationClient)
    }
}


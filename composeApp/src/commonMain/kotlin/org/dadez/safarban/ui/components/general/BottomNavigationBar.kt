package org.dadez.safarban.ui.components.general

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.House
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Package
import com.composables.icons.lucide.Ship
import com.composables.icons.lucide.User
import org.dadez.safarban.ui.navigation.RootComponent

/**
 * Bottom navigation bar that sits at the bottom of every screen
 */
@Composable
fun BottomNavigationBar(
    currentRoute: RootComponent.Config,
    onNavigateToHome: () -> Unit,
    onNavigateToMap: () -> Unit,
    onNavigateToCargo: () -> Unit,
    onNavigateToProfile: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.White)
            .border(
                width = 1.dp,
                color = Color.Gray.copy(alpha = 0.3f)
            )
            .padding(vertical = 12.dp, horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {

        IconNavItem(
            imageVector = Lucide.Ship,
            contentDescription = "Map",
            isSelected = currentRoute is RootComponent.Config.Map,
            onClick = onNavigateToMap
        )

        IconNavItem(
            imageVector = Lucide.House,
            contentDescription = "Home",
            isSelected = currentRoute is RootComponent.Config.Home,
            onClick = onNavigateToHome
        )

        IconNavItem(
            imageVector = Lucide.Package,
            contentDescription = "Cargo",
            isSelected = currentRoute is RootComponent.Config.Cargo,
            onClick = onNavigateToCargo
        )

        IconNavItem(
            imageVector = Lucide.User,
            contentDescription = "Profile",
            isSelected = currentRoute is RootComponent.Config.Profile,
            onClick = onNavigateToProfile
        )
    }
}

@Composable
private fun IconNavItem(
    imageVector: ImageVector,
    contentDescription: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(48.dp)
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = imageVector,
            contentDescription = contentDescription,
            tint = if (isSelected) Color.Black else Color.Gray,
            modifier = Modifier.size(24.dp)
        )
    }
}

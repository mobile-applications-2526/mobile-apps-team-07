package org.dadez.safarban.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.House
import org.dadez.safarban.ui.navigation.RootComponent
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Package
import com.composables.icons.lucide.Ship
import com.composables.icons.lucide.User

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

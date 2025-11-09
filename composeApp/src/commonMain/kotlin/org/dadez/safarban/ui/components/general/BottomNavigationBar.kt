package org.dadez.safarban.ui.components.general

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.composables.icons.lucide.Activity
import com.composables.icons.lucide.ChartNoAxesGantt
import com.composables.icons.lucide.House
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Map
import com.composables.icons.lucide.Ship
import com.composables.icons.lucide.User
import org.dadez.safarban.ui.navigation.RootComponent
import org.dadez.safarban.ui.screens.boat.BoatComponent
import org.dadez.safarban.ui.screens.boat.BoatTab

/**
 * Bottom navigation bar that sits at the bottom of every screen
 */
@Composable
fun BottomNavigationBar(
    currentRoute: RootComponent.Config,
    onNavigateToHome: () -> Unit,
    onNavigateToMap: () -> Unit,
    onNavigateToProfile: () -> Unit,
    boatComponent: BoatComponent? = null,
    modifier: Modifier = Modifier
) {
    // Check if we're in boat detail view
    val isBoatView = currentRoute is RootComponent.Config.Boat

    if (isBoatView && boatComponent != null) {
        // Collect boat state
        val boatState by boatComponent.state.collectAsState()

        // Show boat-specific navigation (no back button here; back lives in top bar)
        BoatBottomNavigationBar(
            currentTab = boatState.selectedTab,
            onTabSelected = { tab -> boatComponent.onTabSelected(tab) },
            modifier = modifier
        )
    } else {
        // Show normal navigation
        StandardBottomNavigationBar(
            currentRoute = currentRoute,
            onNavigateToHome = onNavigateToHome,
            onNavigateToMap = onNavigateToMap,
            onNavigateToProfile = onNavigateToProfile,
            modifier = modifier
        )
    }
}

@Composable
private fun StandardBottomNavigationBar(
    currentRoute: RootComponent.Config,
    onNavigateToHome: () -> Unit,
    onNavigateToMap: () -> Unit,
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
            .padding(vertical = 8.dp, horizontal = 12.dp), // reduced height
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {

        IconNavItem(
            imageVector = Lucide.Map,
            label = "Map",
            contentDescription = "Map",
            isSelected = currentRoute is RootComponent.Config.Map,
            onClick = onNavigateToMap
        )

        IconNavItem(
            imageVector = Lucide.House,
            label = "Home",
            contentDescription = "Home",
            isSelected = currentRoute is RootComponent.Config.Home,
            onClick = onNavigateToHome
        )

        IconNavItem(
            imageVector = Lucide.User,
            label = "Profile",
            contentDescription = "Profile",
            isSelected = currentRoute is RootComponent.Config.Profile,
            onClick = onNavigateToProfile
        )
    }
}

@Composable
private fun IconNavItem(
    imageVector: ImageVector,
    label: String,
    contentDescription: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(56.dp) // slightly smaller but still accessible
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxHeight()
        ) {
            Icon(
                imageVector = imageVector,
                contentDescription = contentDescription,
                tint = if (isSelected) Color.Black else Color.Gray,
                modifier = Modifier.size(20.dp) // smaller icon
            )
            Text(
                text = label,
                fontSize = 10.sp, // smaller label
                color = if (isSelected) Color.Black else Color.Gray,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            )
        }
    }
}

@Composable
private fun BoatBottomNavigationBar(
    currentTab: BoatTab,
    onTabSelected: (BoatTab) -> Unit,
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
            .padding(vertical = 8.dp, horizontal = 12.dp), // reduced height
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Overview (Ship)
        IconNavItem(
            imageVector = Lucide.Ship,
            label = "Overview",
            contentDescription = "Overview",
            isSelected = currentTab == BoatTab.OVERVIEW,
            onClick = { onTabSelected(BoatTab.OVERVIEW) }
        )

        // Operations (Activity)
        IconNavItem(
            imageVector = Lucide.Activity,
            label = "Operations",
            contentDescription = "Operations",
            isSelected = currentTab == BoatTab.OPERATIONS,
            onClick = { onTabSelected(BoatTab.OPERATIONS) }
        )

        // Specifications (ChartNoAxesGantt)
        IconNavItem(
            imageVector = Lucide.ChartNoAxesGantt,
            label = "Specs",
            contentDescription = "Specifications",
            isSelected = currentTab == BoatTab.SPECIFICATIONS,
            onClick = { onTabSelected(BoatTab.SPECIFICATIONS) }
        )
    }
}

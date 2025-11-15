package org.dadez.safarban.ui.screens.boat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.composables.icons.lucide.ChevronLeft
import com.composables.icons.lucide.Lucide
import org.dadez.safarban.ui.screens.boat.screens.operations.OperationsScreen
import org.dadez.safarban.ui.screens.boat.screens.overview.OverviewScreen
import org.dadez.safarban.ui.screens.boat.screens.specifications.SpecsScreen

// Ocean blue color - same as HomeScreen
private val OceanBlue = Color(0xFF006994)

// Height of the bottom navigation bar used across the app
private val BottomNavHeight = 56.dp

/**
 * Boat detail screen showing boat name and selected tab content
 */
@Composable
fun BoatScreen(
    component: BoatComponent,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by component.uiState.collectAsState()

    Box(modifier = modifier.fillMaxSize()) {
        // Map content placed first so overlays (top bar and bottom nav) render on top
        when (uiState.selectedTab) {
            BoatTab.OVERVIEW -> OverviewScreen(component.overviewComponent.viewModel) { component.overviewComponent.onBackClicked() }
            BoatTab.OPERATIONS -> OperationsScreen(component.operationsComponent.viewModel) { component.operationsComponent.onBackClicked() }
            BoatTab.SPECIFICATIONS -> SpecsScreen(component.specsComponent.viewModel) { component.specsComponent.onBackClicked() }
        }

        // Top bar overlays map
        TopBar(
            boatName = uiState.boat?.name ?: "Loading...",
            selectedTab = uiState.selectedTab,
            onBack = onBack,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
private fun TopBar(
    boatName: String,
    selectedTab: BoatTab,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(OceanBlue)
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(horizontal = 12.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Lucide.ChevronLeft,
            contentDescription = "Back",
            tint = Color.White,
            modifier = Modifier
                .size(28.dp)
                .clickable { onBack() }
        )

        Spacer(modifier = Modifier.weight(1f))

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.align(Alignment.CenterVertically)
        ) {
            Text(
                text = boatName,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White
            )

            Text(
                text = when (selectedTab) {
                    BoatTab.OVERVIEW -> "Overview"
                    BoatTab.OPERATIONS -> "Operations"
                    BoatTab.SPECIFICATIONS -> "Specifications"
                },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        Box(modifier = Modifier.size(28.dp))
    }
}


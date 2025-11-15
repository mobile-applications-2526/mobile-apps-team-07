package org.dadez.safarban.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.dadez.safarban.ui.components.boat.BoatCard
import org.dadez.safarban.ui.components.boat.BoatCardData
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items

// Ocean blue color
private val OceanBlue = Color(0xFF006994)

/**
 * Composable for the Home screen that uses a HomeComponent (Decompose-friendly).
 */
@Composable
fun HomeScreen(
    component: HomeComponent,
    onOpenDetails: (String) -> Unit = {},
    onOpenSettings: () -> Unit = {},
    onOpenProfile: (String) -> Unit = {},
    onBoatClick: (String, String) -> Unit = { _, _ -> }
) {
    val state by component.state.collectAsState(initial = HomeUiState())
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Ocean blue top bar that extends behind status bar (same as BoatScreen)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(OceanBlue)
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(horizontal = 16.dp, vertical = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Fleet Overview",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        // Boats are now provided via HomeUiState.boats and populated from the DB by the ViewModel
        val boats = state.boats

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
        ) {
            items(boats, key = { it.id }) { boat ->
                BoatCard(
                    boat = boat,
                    onClick = { onBoatClick(boat.id, boat.name) },
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }

            item {
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

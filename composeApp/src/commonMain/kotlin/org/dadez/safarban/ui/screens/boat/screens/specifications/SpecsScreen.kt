package org.dadez.safarban.ui.screens.boat.screens.specifications

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
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

private val OceanBlue = Color(0xFF006994)
private val BottomNavHeight = 56.dp
private val TopBarHeight = 120.dp

@Composable
fun SpecsScreen(
    viewModel: SpecsViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val boat = uiState.boat

    if (boat == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = OceanBlue)
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5))
            .padding(top = TopBarHeight)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = BottomNavHeight)
    ) {
        InfoCard("General Specifications") {
            InfoRow("Boat Name", boat.name ?: "N/A")
            InfoRow("Type", boat.type ?: "N/A")
            InfoRow("External ID", boat.externalId ?: "N/A")
            InfoRow("Database ID", boat.id?.toString() ?: "N/A")
        }

        Spacer(modifier = Modifier.height(16.dp))

        InfoCard("Location Details") {
            InfoRow("Home Port", boat.location ?: "N/A")
            InfoRow("Latitude", boat.latitude?.toString() ?: "N/A")
            InfoRow("Longitude", boat.longitude?.toString() ?: "N/A")
        }

        Spacer(modifier = Modifier.height(16.dp))

        InfoCard("Ownership") {
            InfoRow("Owner ID", boat.ownerId?.toString() ?: "N/A")
            InfoRow("Registration Status", boat.status ?: "N/A")
        }

        Spacer(modifier = Modifier.height(16.dp))

        InfoCard("Technical Specifications") {
            Text(
                text = "Detailed technical specifications not available",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        InfoCard("Capacity") {
            Text(
                text = "Capacity information not available",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }
    }
}

@Composable
private fun InfoCard(
    title: String,
    content: @Composable () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, shape = MaterialTheme.shapes.medium)
            .padding(16.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = OceanBlue,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        content()
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            color = Color(0xFF1D2124),
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}

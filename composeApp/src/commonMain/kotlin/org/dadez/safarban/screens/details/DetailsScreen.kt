package org.dadez.safarban.screens.details

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun DetailsScreen(component: DetailsComponent, onBack: () -> Unit = {}) {
    val state by component.state.collectAsState(initial = DetailsUiState(id = "0"))

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = state.title, style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(8.dp))

        if (state.isLoading) {
            Text("Loading...")
        } else {
            Text(text = state.description ?: "No details")
        }

        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = { component.onRefresh() }) { Text("Refresh") }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onBack) { Text("Back") }
    }
}

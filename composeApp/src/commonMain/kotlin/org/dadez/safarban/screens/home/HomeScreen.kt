package org.dadez.safarban.screens.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Composable for the Home screen that uses a HomeComponent (Decompose-friendly).
 */
@Composable
fun HomeScreen(
    component: HomeComponent,
    onOpenDetails: (String) -> Unit = {},
    onOpenSettings: () -> Unit = {},
    onOpenProfile: (String) -> Unit = {}
) {
    val state by component.state.collectAsState(initial = HomeUiState())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = state.title, style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(8.dp))

        // Navigation buttons to new screens
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(
                onClick = onOpenSettings,
                modifier = Modifier.weight(1f)
            ) {
                Text("Settings")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = { onOpenProfile("user123") },
                modifier = Modifier.weight(1f)
            ) {
                Text("Profile")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (state.isLoading) {
            Text("Loading...")
        } else {
            if (state.items.isEmpty()) {
                Text("No items")
            } else {
                LazyColumn(modifier = Modifier.fillMaxWidth()) {
                    itemsIndexed(state.items) { idx, item ->
                        Text(
                            text = item,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    component.onSelect(idx)
                                    onOpenDetails(item)
                                }
                                .padding(8.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = { component.onRefresh() }) { Text("Refresh") }
    }
}

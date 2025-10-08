package org.dadez.safarban.ui.screens.cargo

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CargoScreen(
    component: CargoComponent,
    onBack: () -> Unit
) {
    val uiState by component.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        CenterAlignedTopAppBar(
            title = { Text(uiState.title) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Text("←")
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Cargo page content goes here.")
                Spacer(modifier = Modifier.height(8.dp))
                Text("Static information about cargo and packages.")
            }
        }
    }
}

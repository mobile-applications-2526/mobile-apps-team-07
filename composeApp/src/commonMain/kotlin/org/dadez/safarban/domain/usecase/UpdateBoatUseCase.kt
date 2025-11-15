package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.Boat
import org.dadez.safarban.domain.repository.BoatRepository

class UpdateBoatUseCase(private val repository: BoatRepository) {
    suspend operator fun invoke(boat: Boat) {
        repository.updateBoat(boat)
    }
}

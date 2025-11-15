package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.Boat
import org.dadez.safarban.domain.repository.BoatRepository

class GetAllBoatsUseCase(private val repository: BoatRepository) {
    suspend operator fun invoke(): List<Boat> = repository.getAllBoats()
}

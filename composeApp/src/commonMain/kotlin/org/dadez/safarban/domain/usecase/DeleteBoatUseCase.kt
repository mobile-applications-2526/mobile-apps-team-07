package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.repository.BoatRepository

class DeleteBoatUseCase(private val repository: BoatRepository) {
    suspend operator fun invoke(id: Long) {
        repository.deleteBoatById(id)
    }
}

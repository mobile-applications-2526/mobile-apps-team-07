package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

class GetUserByIdUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(id: Long): User? = repository.getUserById(id)
}

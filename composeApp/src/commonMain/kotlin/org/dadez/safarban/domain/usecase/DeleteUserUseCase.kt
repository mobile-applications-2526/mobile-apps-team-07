package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

class DeleteUserUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(userId: Long) {
        repository.deleteUserById(userId)
    }
}

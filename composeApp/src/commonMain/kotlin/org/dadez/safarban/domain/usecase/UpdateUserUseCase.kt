package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

class UpdateUserUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(user: User) {
        repository.updateUser(user)
    }
}

package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

class GetAllUsersUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(): List<User> = repository.getAllUsers()
}

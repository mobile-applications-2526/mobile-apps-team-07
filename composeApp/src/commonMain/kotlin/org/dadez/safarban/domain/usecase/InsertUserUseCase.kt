package org.dadez.safarban.domain.usecase

import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

class InsertUserUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(user: User) {
        repository.insertUser(user)
    }
}

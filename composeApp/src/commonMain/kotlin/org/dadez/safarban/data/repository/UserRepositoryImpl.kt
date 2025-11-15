package org.dadez.safarban.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

class UserRepositoryImpl(private val dbRepo: org.dadez.safarban.database.UserRepository) : UserRepository {

    private fun mapDbUserToDomain(u: org.dadez.safarban.database.User): User = User(
        id = u.id,
        username = u.username,
        email = u.email,
        fullName = u.full_name,
        createdAt = u.created_at,
        updatedAt = u.updated_at
    )

    override suspend fun getAllUsers(): List<User> = withContext(Dispatchers.Default) {
        dbRepo.getAllUsers().map { mapDbUserToDomain(it) }
    }

    override suspend fun getUserById(id: Long): User? = withContext(Dispatchers.Default) {
        dbRepo.getUserById(id)?.let { mapDbUserToDomain(it) }
    }

    override suspend fun getUserByUsername(username: String): User? = withContext(Dispatchers.Default) {
        dbRepo.getUserByUsername(username)?.let { mapDbUserToDomain(it) }
    }

    override suspend fun insertUser(user: User) = withContext(Dispatchers.Default) {
        dbRepo.insertUser(user.username, user.email, user.fullName)
        Unit
    }

    override suspend fun updateUser(user: User) = withContext(Dispatchers.Default) {
        dbRepo.updateUser(user.id, user.username, user.email, user.fullName)
        Unit
    }

    override suspend fun deleteUserById(id: Long) = withContext(Dispatchers.Default) {
        dbRepo.deleteUserById(id)
        Unit
    }

    override suspend fun countUsers(): Long = withContext(Dispatchers.Default) {
        dbRepo.countUsers()
    }
}

package org.dadez.safarban.domain.repository

import org.dadez.safarban.domain.model.User

interface UserRepository {
    suspend fun getAllUsers(): List<User>
    suspend fun getUserById(id: Long): User?
    suspend fun getUserByUsername(username: String): User?
    suspend fun insertUser(user: User)
    suspend fun updateUser(user: User)
    suspend fun deleteUserById(id: Long)
    suspend fun countUsers(): Long
}

package org.dadez.safarban.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.dadez.safarban.data.mapper.toDomain
import org.dadez.safarban.data.mapper.toEntity
import org.dadez.safarban.database.SafarbanDatabase
import org.dadez.safarban.domain.model.User
import org.dadez.safarban.domain.repository.UserRepository

/**
 * Repository class for User database operations
 * Provides a clean API for CRUD operations on the user table
 */
class UserRepositoryImpl(private val database: SafarbanDatabase) : UserRepository {

    private val queries = database.userQueries

    /**
     * Get all users from the database
     */
    override suspend fun getAllUsers(): List<User> = withContext(Dispatchers.Default) {
        queries.selectAll().executeAsList().map { it.toDomain() }
    }

    /**
     * Get user by ID
     */
    override suspend fun getUserById(id: Long): User? = withContext(Dispatchers.Default) {
        queries.selectById(id).executeAsOneOrNull()?.toDomain()
    }

    /**
     * Get user by username
     */
    override suspend fun getUserByUsername(username: String): User? =
        withContext(Dispatchers.Default) {
            queries.selectByUsername(username).executeAsOneOrNull()?.toDomain()
        }

    /**
     * Insert a new user
     */
    override suspend fun insertUser(user: User): Unit = withContext(Dispatchers.Default) {
        user.toEntity().let {
            queries.insert(
                username = it.username,
                email = it.email,
                full_name = it.full_name,
                created_at = it.created_at,
                updated_at = it.updated_at
            )
        }
    }

    /**
     * Update an existing user
     */
    override suspend fun updateUser(user: User): Unit = withContext(Dispatchers.Default) {
        user.toEntity().let {
            queries.update(
                id = it.id,
                username = it.username,
                email = it.email,
                full_name = it.full_name,
                updated_at = it.updated_at
            )
        }
    }

    /**
     * Delete user by ID
     */
    override suspend fun deleteUserById(id: Long): Unit = withContext(Dispatchers.Default) {
        queries.deleteById(id)
    }

    /**
     * Count total users
     */
    override suspend fun countUsers(): Long = withContext(Dispatchers.Default) {
        queries.countAll().executeAsOne()
    }
}


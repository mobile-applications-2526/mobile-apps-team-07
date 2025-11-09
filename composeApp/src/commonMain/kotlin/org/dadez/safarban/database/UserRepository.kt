package org.dadez.safarban.database

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock

/**
 * Repository class for User database operations
 * Provides a clean API for CRUD operations on the user table
 */
class UserRepository(private val database: SafarbanDatabase) {

    private val queries = database.userQueries

    /**
     * Get all users from the database
     */
    suspend fun getAllUsers(): List<User> = withContext(Dispatchers.Default) {
        queries.selectAll().executeAsList()
    }

    /**
     * Get user by ID
     */
    suspend fun getUserById(id: Long): User? = withContext(Dispatchers.Default) {
        queries.selectById(id).executeAsOneOrNull()
    }

    /**
     * Get user by username
     */
    suspend fun getUserByUsername(username: String): User? = withContext(Dispatchers.Default) {
        queries.selectByUsername(username).executeAsOneOrNull()
    }

    /**
     * Get user by email
     */
    suspend fun getUserByEmail(email: String): User? = withContext(Dispatchers.Default) {
        queries.selectByEmail(email).executeAsOneOrNull()
    }

    /**
     * Insert a new user
     */
    suspend fun insertUser(
        username: String,
        email: String,
        fullName: String
    ) = withContext(Dispatchers.Default) {
        val currentTime = Clock.System.now().toEpochMilliseconds()
        queries.insert(username, email, fullName, currentTime, currentTime)
    }

    /**
     * Update an existing user
     */
    suspend fun updateUser(
        id: Long,
        username: String,
        email: String,
        fullName: String
    ) = withContext(Dispatchers.Default) {
        val currentTime = Clock.System.now().toEpochMilliseconds()
        queries.update(username, email, fullName, currentTime, id)
    }

    /**
     * Delete user by ID
     */
    suspend fun deleteUserById(id: Long) = withContext(Dispatchers.Default) {
        queries.deleteById(id)
    }

    /**
     * Delete all users
     */
    suspend fun deleteAllUsers() = withContext(Dispatchers.Default) {
        queries.deleteAll()
    }

    /**
     * Count total users
     */
    suspend fun countUsers(): Long = withContext(Dispatchers.Default) {
        queries.countAll().executeAsOne()
    }
}


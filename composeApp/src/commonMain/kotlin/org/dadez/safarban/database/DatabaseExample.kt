package org.dadez.safarban.database

import kotlinx.coroutines.runBlocking

/**
 * Example usage of the SQLDelight database
 */
object DatabaseExample {

    /**
     * Example of how to initialize and use the database
     *
     * Usage on Android:
     * ```
     * val driverFactory = DriverFactory(context)
     * val database = createDatabase(driverFactory)
     * val userRepository = UserRepository(database)
     * ```
     *
     * Usage on iOS:
     * ```
     * val driverFactory = DriverFactory()
     * val database = createDatabase(driverFactory)
     * val userRepository = UserRepository(database)
     * ```
     */
    fun exampleUsage(userRepository: UserRepository) = runBlocking {
        // Insert a new user
        userRepository.insertUser(
            username = "johndoe",
            email = "john@example.com",
            fullName = "John Doe"
        )

        // Get all users
        val allUsers = userRepository.getAllUsers()
        println("All users: $allUsers")

        // Get user by username
        val user = userRepository.getUserByUsername("johndoe")
        println("Found user: $user")

        // Update user
        user?.let {
            userRepository.updateUser(
                id = it.id,
                username = "johndoe",
                email = "john.doe@example.com",
                fullName = "John Doe Updated"
            )
        }

        // Count users
        val count = userRepository.countUsers()
        println("Total users: $count")

        // Delete user
        user?.let {
            userRepository.deleteUserById(it.id)
        }
    }
}


# SQLDelight Database Setup

This project uses SQLDelight for cross-platform database management.

## Database Structure

### User Table

The `user` table stores user information with the following schema:

- `id`: INTEGER PRIMARY KEY AUTOINCREMENT - Unique identifier for each user
- `username`: TEXT NOT NULL UNIQUE - User's username
- `email`: TEXT NOT NULL UNIQUE - User's email address
- `full_name`: TEXT NOT NULL - User's full name
- `created_at`: INTEGER NOT NULL - Timestamp when user was created
- `updated_at`: INTEGER NOT NULL - Timestamp when user was last updated

### Indexes

- `user_username`: Index on username for faster lookups
- `user_email`: Index on email for faster lookups

## Usage

### 1. Initialize the Database

**On Android:**
```kotlin
val driverFactory = DriverFactory(context)
val database = createDatabase(driverFactory)
val userRepository = UserRepository(database)
```

**On iOS:**
```kotlin
val driverFactory = DriverFactory()
val database = createDatabase(driverFactory)
val userRepository = UserRepository(database)
```

### 2. Perform Database Operations

```kotlin
// Insert a new user
userRepository.insertUser(
    username = "johndoe",
    email = "john@example.com",
    fullName = "John Doe"
)

// Get all users
val allUsers = userRepository.getAllUsers()

// Get user by username
val user = userRepository.getUserByUsername("johndoe")

// Get user by email
val userByEmail = userRepository.getUserByEmail("john@example.com")

// Update user
userRepository.updateUser(
    id = userId,
    username = "johndoe",
    email = "john.updated@example.com",
    fullName = "John Doe Updated"
)

// Delete user by ID
userRepository.deleteUserById(userId)

// Count all users
val count = userRepository.countUsers()

// Delete all users
userRepository.deleteAllUsers()
```

## Files

- `User.sq`: SQL schema definition with queries
- `DriverFactory.kt`: Common interface for platform-specific drivers
- `DriverFactory.android.kt`: Android implementation using AndroidSqliteDriver
- `DriverFactory.ios.kt`: iOS implementation using NativeSqliteDriver
- `UserRepository.kt`: Repository class providing a clean API for database operations
- `DatabaseExample.kt`: Example usage of the database

## Generated Code

SQLDelight generates the following:
- `SafarbanDatabase`: Database class
- `UserQueries`: Type-safe query interface
- `User`: Data class representing a user row

These are generated in the build directory and are available after running Gradle sync or build.


package org.dadez.safarban.domain.model

data class User(
    val id: Long,
    val username: String,
    val email: String,
    val fullName: String,
    val createdAt: Long,
    val updatedAt: Long
)

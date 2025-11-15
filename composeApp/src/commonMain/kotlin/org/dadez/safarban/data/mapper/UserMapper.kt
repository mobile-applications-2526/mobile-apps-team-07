package org.dadez.safarban.data.mapper

import org.dadez.safarban.domain.model.User
import org.dadez.safarban.database.User as UserEntity

fun UserEntity.toDomain(): User {
    return User(
        id = this.id,
        username = this.username,
        email = this.email,
        fullName = this.full_name,
        createdAt = this.created_at,
        updatedAt = this.updated_at
    )
}

fun User.toEntity(): UserEntity {
    return UserEntity(
        id = this.id,
        username = this.username,
        email = this.email,
        full_name = this.fullName,
        created_at = this.createdAt,
        updated_at = this.updatedAt
    )
}

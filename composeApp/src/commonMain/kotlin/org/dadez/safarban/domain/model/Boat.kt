package org.dadez.safarban.domain.model

data class Boat(
    val id: Long? = null,
    val externalId: String? = null,
    val name: String? = null,
    val type: String? = null,
    val location: String? = null,
    val status: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val ownerId: Long? = null
)

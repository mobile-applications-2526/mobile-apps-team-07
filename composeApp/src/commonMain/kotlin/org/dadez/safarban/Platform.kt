package org.dadez.safarban

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
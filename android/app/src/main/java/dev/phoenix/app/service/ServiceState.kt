package dev.phoenix.app.service

sealed class ServiceState {
    data object Running : ServiceState()
    data object Paused : ServiceState()
    data class Error(val message: String) : ServiceState()
}

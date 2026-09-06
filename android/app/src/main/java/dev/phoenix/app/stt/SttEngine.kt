package dev.phoenix.app.stt

interface SttEngine {
    fun startListening(onResult: (String, Boolean) -> Unit) // text, isFinal
    fun stopListening()
    val isListening: Boolean
}

package dev.phoenix.app.ui.conversation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dev.phoenix.app.data.DataRepository
import dev.phoenix.app.data.entity.ConversationEntity
import dev.phoenix.app.network.PhoenixServerClient
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ConversationViewModel @Inject constructor(
    private val dataRepository: DataRepository,
    private val serverClient: PhoenixServerClient
) : ViewModel() {

    val messages: StateFlow<List<ConversationEntity>> = dataRepository.getRecentConversations()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), emptyList())

    fun sendMessage(text: String) {
        viewModelScope.launch {
            // Save user message locally
            dataRepository.addUserMessage(text)

            // Send to Phoenix server
            val response = serverClient.askPan(text)
            if (response != null) {
                dataRepository.addPanResponse(response.response_text)
            } else {
                dataRepository.addPanResponse("[Phoenix is offline — message queued]")
            }
        }
    }
}

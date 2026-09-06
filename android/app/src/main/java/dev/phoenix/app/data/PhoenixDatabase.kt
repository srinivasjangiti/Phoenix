package dev.phoenix.app.data

import androidx.room.Database
import androidx.room.RoomDatabase
import dev.phoenix.app.data.dao.*
import dev.phoenix.app.data.entity.*

@Database(
    entities = [PendingUploadEntity::class, ConversationEntity::class, SettingEntity::class],
    version = 1,
    exportSchema = false
)
abstract class PhoenixDatabase : RoomDatabase() {
    abstract fun pendingUploadDao(): PendingUploadDao
    abstract fun conversationDao(): ConversationDao
    abstract fun settingsDao(): SettingsDao
}

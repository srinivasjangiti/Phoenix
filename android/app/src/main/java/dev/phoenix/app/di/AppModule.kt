package dev.phoenix.app.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import dev.phoenix.app.ai.LocalLlm
import dev.phoenix.app.data.PhoenixDatabase
import dev.phoenix.app.data.dao.*
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): PhoenixDatabase {
        return Room.databaseBuilder(context, PhoenixDatabase::class.java, "pan.db")
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun providePendingUploadDao(db: PhoenixDatabase): PendingUploadDao = db.pendingUploadDao()

    @Provides
    fun provideConversationDao(db: PhoenixDatabase): ConversationDao = db.conversationDao()

    @Provides
    fun provideSettingsDao(db: PhoenixDatabase): SettingsDao = db.settingsDao()

    @Provides
    @Singleton
    fun provideLocalLlm(@ApplicationContext context: Context): LocalLlm = LocalLlm(context)
}

package com.mindsettracker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class HabitAlarmModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "HabitAlarm"

  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    val manager = context.getSystemService(NotificationManager::class.java)
    promise.resolve(Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent())
  }

  @ReactMethod
  fun openFullScreenSettings(promise: Promise) {
    try {
      val intent = if (Build.VERSION.SDK_INT >= 34) {
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("ALARM_SETTINGS", error) }
  }

  @ReactMethod
  fun ensureAlarmChannel(id: String, name: String, promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 26) {
        val manager = context.getSystemService(NotificationManager::class.java)
        val channel = manager.getNotificationChannel(id) ?: NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH).apply {
          setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
            AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
          enableVibration(true)
          vibrationPattern = longArrayOf(0, 700, 350, 700)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        channel.name = name
        manager.createNotificationChannel(channel)
      }
      promise.resolve(id)
    } catch (error: Exception) { promise.reject("ALARM_CHANNEL", error) }
  }

  @ReactMethod
  fun closeAlarm(notificationId: String?, occurrenceTime: String?, promise: Promise) {
    context.runOnUiQueueThread {
      val activity = context.currentActivity as? AlarmActivity
      val notification = activity?.intent?.getBundleExtra("notification")
      if (notificationId == null || (notification?.getString("id") == notificationId &&
          notification.getBundle("data")?.getString("occurrenceTime") == occurrenceTime)) {
        activity?.finish()
      }
      promise.resolve(null)
    }
  }
}

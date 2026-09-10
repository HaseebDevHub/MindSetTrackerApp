package com.mindsettracker

import android.content.Intent
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class AlarmActivity : ReactActivity() {
  override fun getMainComponentName() = "MindsetHabitAlarm"

  override fun onCreate(savedInstanceState: Bundle?) {
    resolveFullScreenNotification()
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= 27) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  private fun resolveFullScreenNotification() {
    if (intent.getBundleExtra("notification") != null) return
    // Notifee 9.1.8 includes the payload on content taps, but not on its
    // full-screen PendingIntent. Recover the just-posted alarm from the OS.
    // This also works on a cold start, without relying on a JS event cache.
    val manager = getSystemService(NotificationManager::class.java)
    val posted = manager.activeNotifications
      .filter { it.notification.extras?.getString("alertType") == "alarm" }
      .maxByOrNull { it.postTime }
    posted?.notification?.extras?.getBundle("notifee.notification")?.let {
      intent.putExtra("notification", it)
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    recreate()
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
      override fun getLaunchOptions(): Bundle = Bundle().apply {
        putBundle("notification", intent.getBundleExtra("notification"))
      }
    }
}

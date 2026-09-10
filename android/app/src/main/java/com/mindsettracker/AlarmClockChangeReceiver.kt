package com.mindsettracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.facebook.react.HeadlessJsTaskService

class AlarmClockChangeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_TIME_CHANGED && intent.action != Intent.ACTION_TIMEZONE_CHANGED) return
    try {
      context.startService(Intent(context, AlarmClockChangeService::class.java))
      HeadlessJsTaskService.acquireWakeLockNow(context)
    } catch (_: IllegalStateException) {
      // Restricted OEMs may defer background execution; foreground reconciles too.
    }
  }
}

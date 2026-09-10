# Habit alerts

## Implementation

- `reminderType` defaults to `reminder`. WatermelonDB migration 6 adds the nullable column without resetting data. Backup version 1 accepts schema-5 and schema-6 snapshots; old habits restore as reminders.
- Create/Edit Habit offers Reminder and Alarm while alerts are enabled. Both share the existing two-active-habit limit. Today cards show Bell or AlarmClock, respectively.
- Global reminders retain their daily schedules and channel. Habit alerts use dated occurrences and the existing habit applicability rules.
- Android alarms use the separate `mindset-habit-alarms` channel, system alarm sound, vibration, Snooze and Dismiss. Exact timing and full-screen presentation depend on OS access and user channel settings. Missing access retains a prominent notification fallback.
- The non-exported `AlarmActivity` hosts a themed, localized React Native screen. Notifee 9.1.8 full-screen intents omit the notification bundle; the activity retrieves the newest posted alarm payload from Android's active notifications. Explicit notification taps retain their own payload.
- Snooze schedules one replacement occurrence ten minutes later. Dismiss cancels only the displayed occurrence, retaining future schedules. Persistent action receipts and a shared serial queue prevent duplicate actions and overlapping reconciliation.
- Changes to type, time, scheduling, archive state or enabled state invalidate obsolete triggers, snoozes and displayed alerts. Normal successful database writes remain independent of notification failures.

## Platform limits

- Up to 20 upcoming applicable occurrences are scheduled per habit, plus three global reminders and up to two snoozes (45 triggers maximum). Reconciliation replenishes this window on application startup/foreground, relevant changes and available notification events.
- iOS does not deliver background `DELIVERED` callbacks for trigger notifications. Users must reopen periodically to replenish the finite occurrence window. iOS uses a time-sensitive notification, not a guaranteed full-screen alarm or AlarmKit.
- Android ringing is bounded to five minutes. Device volume, Do Not Disturb, battery restrictions and channel settings still apply. Force-stopping an Android application is not equivalent to normal process termination; reopen it to resume scheduling.
- No `USE_EXACT_ALARM`, backend, push service, database reset or new dependency is introduced. Full-screen intent distribution eligibility must be reviewed before Play Store release.

## Validation

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
cd android && ./gradlew assembleDebug
cd ../ios && pod install
```

Tests cover defaults/migration/backup compatibility, calendar recurrence, alert limits, icons and RTL/themes, permissions/fallback, obsolete schedule cleanup, Snooze/Dismiss, retry and deduplication. Android debug compilation and iOS pod integration were verified. A full iOS build requires Xcode, which was unavailable in this environment.

Before release, verify on physical Android/iOS devices: foreground/background/process termination, locked screen, reboot, exact/full-screen permission denial, channel sound settings, two simultaneous alarms, Snooze/Dismiss actions and archive/delete/restore cancellation. Automated tests and emulator checks do not establish OEM-specific delivery guarantees.

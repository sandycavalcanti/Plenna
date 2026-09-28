package expo.modules.plennausagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlennaUsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PlennaUsageStats")

    AsyncFunction("getModuleStatus") {
      mapOf(
        "available" to true,
        "platform" to "android",
        "module" to "plenna-usage-stats"
      )
    }

    AsyncFunction("hasUsageAccess") {
      val context = appContext.reactContext
        ?: return@AsyncFunction false

      val appOpsManager =
        context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager

      val mode = appOpsManager.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )

      mode == AppOpsManager.MODE_ALLOWED
    }

    AsyncFunction("openUsageAccessSettings") {
      val context = appContext.reactContext
        ?: return@AsyncFunction false

      return@AsyncFunction try {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        context.startActivity(intent)
        true
      } catch (_: Exception) {
        false
      }
    }

    AsyncFunction("getUsageEvents") { startTime: Double, endTime: Double ->
      val context = appContext.reactContext
        ?: return@AsyncFunction emptyList<Map<String, Any>>()

      val usageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

      val usageEvents = usageStatsManager.queryEvents(
        startTime.toLong(),
        endTime.toLong()
      )

      val event = UsageEvents.Event()
      val result = mutableListOf<Map<String, Any>>()

      while (usageEvents.hasNextEvent()) {
        usageEvents.getNextEvent(event)

        if (
          event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
          event.eventType == UsageEvents.Event.ACTIVITY_PAUSED
        ) {
          result.add(
            mapOf(
              "packageName" to event.packageName,
              "timestamp" to event.timeStamp,
              "eventType" to event.eventType
            )
          )
        }

        // Limite apenas para o diagnóstico de eventos crus.
        if (result.size >= 200) {
          break
        }
      }

      result
    }

    AsyncFunction("getForegroundUsage") { startTime: Double, endTime: Double ->
      val context = appContext.reactContext
        ?: return@AsyncFunction emptyList<Map<String, Any>>()

      val start = startTime.toLong()
      val end = endTime.toLong()

      if (start <= 0L || end <= start) {
        return@AsyncFunction emptyList<Map<String, Any>>()
      }

      val usageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

      // O prefixo apenas reconstrói o estado; o acumulador recorta toda duração em [start, end].
      val usageEvents = usageStatsManager.queryEvents(ForegroundUsageAccumulator.queryStart(start), end)
        ?: return@AsyncFunction emptyList<Map<String, Any>>()
      val event = UsageEvents.Event()
      val accumulator = ForegroundUsageAccumulator(start, end)

      while (usageEvents.hasNextEvent()) {
        usageEvents.getNextEvent(event)

        val type = when (event.eventType) {
          UsageEvents.Event.ACTIVITY_RESUMED -> ForegroundUsageAccumulator.Event.RESUMED
          UsageEvents.Event.ACTIVITY_PAUSED -> ForegroundUsageAccumulator.Event.PAUSED
          UsageEvents.Event.ACTIVITY_STOPPED -> ForegroundUsageAccumulator.Event.STOPPED
          UsageEvents.Event.SCREEN_NON_INTERACTIVE -> ForegroundUsageAccumulator.Event.SCREEN_OFF
          UsageEvents.Event.KEYGUARD_SHOWN -> ForegroundUsageAccumulator.Event.LOCKED
          UsageEvents.Event.DEVICE_SHUTDOWN -> ForegroundUsageAccumulator.Event.SHUTDOWN
          UsageEvents.Event.DEVICE_STARTUP -> ForegroundUsageAccumulator.Event.STARTUP
          else -> continue
        }
        accumulator.accept(type, event.timeStamp, event.packageName, event.className)
      }

      accumulator.finish()
        .map { (packageName, durationSeconds) ->
          mapOf(
            "packageName" to packageName,
            "durationSeconds" to durationSeconds
          )
        }
        .sortedByDescending { item ->
          (item["durationSeconds"] as? Long) ?: 0L
        }
    }
  }
}

package expo.modules.plennausagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import android.os.UserManager
import java.util.UUID
import java.io.File
import java.util.concurrent.atomic.AtomicLong
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlennaUsageStatsModule : Module() {
  private val generation = AtomicLong(0)
  override fun definition() = ModuleDefinition {
    Name("PlennaUsageStats")

    // Fora da fila de coleta, permite que background e logout interrompam a consulta.
    Function("cancelUsageCollection") { generation.incrementAndGet(); true }
    AsyncFunction("getUsageObservations") { windows: List<Map<String, Double>>, packages: List<String>, eligibleFrom: Double, includeDetails: Boolean ->
      collectUsageObservations(windows,packages,eligibleFrom,includeDetails)
    }.runOnQueue(Queues.DEFAULT)

    AsyncFunction("getInstallationAnchor") {
      val context = appContext.reactContext ?: throw IllegalStateException("CONTEXT_UNAVAILABLE")
      synchronized(PlennaUsageStatsModule::class.java) {
        val file = File(context.noBackupFilesDir, "rf017-installation-anchor")
        if (file.exists()) file.readText() else UUID.randomUUID().toString().also { file.writeText(it) }
      }
    }.runOnQueue(Queues.DEFAULT)

    AsyncFunction("getUsageSnapshots") { windows: List<Map<String, Double>>, packages: List<String> ->
      val context = appContext.reactContext
      fun unavailable(reason: String) = mapOf("sourceStatus" to "UNAVAILABLE", "reason" to reason)
      if (context == null) return@AsyncFunction windows.map { unavailable("SOURCE_UNAVAILABLE") }
      if (windows.isEmpty() || windows.size > 3 || packages.isEmpty() || packages.size > 200) throw IllegalArgumentException("INVALID_WINDOWS")
      val periods = windows.map { w -> Pair(w["start"]?.toLong() ?: 0L, w["end"]?.toLong() ?: 0L) }
      if (periods.any { (s,e) -> s <= 0L || e <= s || e-s > 25*3600000L || e > System.currentTimeMillis() }) throw IllegalArgumentException("INVALID_WINDOWS")
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      fun allowed() = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName) == AppOpsManager.MODE_ALLOWED
      if (!allowed()) return@AsyncFunction windows.map { unavailable("USAGE_ACCESS_DENIED") }
      if (!(context.getSystemService(Context.USER_SERVICE) as UserManager).isUserUnlocked) return@AsyncFunction windows.map { unavailable("DEVICE_LOCKED") }
      try {
        val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val events = manager.queryEvents(ForegroundUsageAccumulator.queryStart(periods.minOf { it.first }), periods.maxOf { it.second })
          ?: return@AsyncFunction windows.map { unavailable("SOURCE_UNAVAILABLE") }
        val accumulators = periods.map { (s,e) -> ForegroundUsageAccumulator(s,e,packages.toSet()) }
        val event = UsageEvents.Event()
        val evidence = IntArray(periods.size)
        var count = 0
        while(events.hasNextEvent()) {
          if (++count > 250000) return@AsyncFunction windows.map { unavailable("QUERY_FAILED") }
          events.getNextEvent(event)
          periods.forEachIndexed { i,p -> if(event.timeStamp >= p.first && event.timeStamp < p.second) evidence[i]++ }
          val type = when(event.eventType) {
            UsageEvents.Event.ACTIVITY_RESUMED -> ForegroundUsageAccumulator.Event.RESUMED
            UsageEvents.Event.ACTIVITY_PAUSED -> ForegroundUsageAccumulator.Event.PAUSED
            UsageEvents.Event.ACTIVITY_STOPPED -> ForegroundUsageAccumulator.Event.STOPPED
            UsageEvents.Event.SCREEN_NON_INTERACTIVE -> ForegroundUsageAccumulator.Event.SCREEN_OFF
            UsageEvents.Event.KEYGUARD_SHOWN -> ForegroundUsageAccumulator.Event.LOCKED
            UsageEvents.Event.DEVICE_SHUTDOWN -> ForegroundUsageAccumulator.Event.SHUTDOWN
            UsageEvents.Event.DEVICE_STARTUP -> ForegroundUsageAccumulator.Event.STARTUP
            else -> continue
          }
          accumulators.forEach { it.accept(type,event.timeStamp,event.packageName,event.className) }
        }
        if(!allowed()) return@AsyncFunction windows.map { unavailable("USAGE_ACCESS_DENIED") }
        accumulators.mapIndexed { i, accumulator ->
          val totals = accumulator.finish()
          if(evidence[i] == 0 && totals.values.none { it > 0 }) unavailable("SOURCE_UNAVAILABLE")
          else mapOf("sourceStatus" to "AVAILABLE", "qualityFlags" to accumulator.qualityFlags.toList(),
            "applications" to packages.map { p -> mapOf("packageId" to p,"durationSeconds" to (totals[p] ?: 0L)) })
        }
      } catch (_: SecurityException) { windows.map { unavailable("USAGE_ACCESS_DENIED") } }
      catch (_: Exception) { windows.map { unavailable("QUERY_FAILED") } }
    }.runOnQueue(Queues.DEFAULT)

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
  private fun collectUsageObservations(windows: List<Map<String, Double>>, packages: List<String>, eligibleFrom: Double, includeDetails: Boolean): List<Map<String,Any>> {
      val version = generation.incrementAndGet()
      val context = appContext.reactContext
      fun unavailable(reason: String) = windows.map { mapOf("sourceStatus" to "UNAVAILABLE", "reason" to reason) }
      if (context == null) return unavailable("SOURCE_UNAVAILABLE")
      if (windows.isEmpty() || windows.size > 3 || packages.isEmpty() || packages.size > 30 || packages.toSet().size != packages.size) throw IllegalArgumentException("INVALID_WINDOWS")
      val periods = windows.map { Pair(it["start"]?.toLong() ?: 0L,it["end"]?.toLong() ?: 0L) }
      if (periods.any { (s,e) -> s < eligibleFrom.toLong() || s<=0 || e<=s || e-s>25*3600000L || e>System.currentTimeMillis() }) throw IllegalArgumentException("INVALID_WINDOWS")
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      fun allowed() = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,Process.myUid(),context.packageName)==AppOpsManager.MODE_ALLOWED
      if (!allowed()) return unavailable("USAGE_ACCESS_DENIED")
      if (!(context.getSystemService(Context.USER_SERVICE) as UserManager).isUserUnlocked) return unavailable("DEVICE_LOCKED")
      try {
        val manager=context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val events=manager.queryEvents(ForegroundUsageAccumulator.queryStart(periods.minOf { it.first }),periods.maxOf { it.second }) ?: return unavailable("SOURCE_UNAVAILABLE")
        val reconstructor=UsageAccessReconstructor(periods,packages.toSet(),eligibleFrom.toLong())
        val event=UsageEvents.Event();var count=0
        while(events.hasNextEvent()) {
          if (generation.get()!=version) return unavailable("CANCELLED")
          if (++count>250000) return unavailable("PROCESSING_LIMIT")
          events.getNextEvent(event)
          val type=when(event.eventType) {
            UsageEvents.Event.ACTIVITY_RESUMED -> ForegroundUsageAccumulator.Event.RESUMED
            UsageEvents.Event.ACTIVITY_PAUSED -> ForegroundUsageAccumulator.Event.PAUSED
            UsageEvents.Event.ACTIVITY_STOPPED -> ForegroundUsageAccumulator.Event.STOPPED
            UsageEvents.Event.SCREEN_NON_INTERACTIVE -> ForegroundUsageAccumulator.Event.SCREEN_OFF
          UsageEvents.Event.SCREEN_INTERACTIVE -> ForegroundUsageAccumulator.Event.SCREEN_ON
          UsageEvents.Event.KEYGUARD_HIDDEN -> ForegroundUsageAccumulator.Event.UNLOCKED
            UsageEvents.Event.KEYGUARD_SHOWN -> ForegroundUsageAccumulator.Event.LOCKED
            UsageEvents.Event.DEVICE_SHUTDOWN -> ForegroundUsageAccumulator.Event.SHUTDOWN
            UsageEvents.Event.DEVICE_STARTUP -> ForegroundUsageAccumulator.Event.STARTUP
            else -> continue
          }
          // O SDK público expõe classes, sem um identificador portátil da instância da Activity.
          reconstructor.accept(type,event.timeStamp,event.packageName,event.className)
        }
        if (!allowed()) return unavailable("USAGE_ACCESS_DENIED")
        if (generation.get()!=version) return unavailable("CANCELLED")
        if (!reconstructor.evidence) return unavailable("SOURCE_UNAVAILABLE")
        val result=reconstructor.finish()
        return if(includeDetails) result else result.map { day ->
          @Suppress("UNCHECKED_CAST")
          val apps=day["applications"] as? List<Map<String,Any>>
          if(apps==null)day else day + ("applications" to apps.map { it + ("accesses" to emptyList<Map<String,Any>>()) })
        }
      } catch (_:SecurityException) { return unavailable("USAGE_ACCESS_DENIED") }
      catch (_:Exception) { return unavailable("QUERY_FAILED") }
  }

}

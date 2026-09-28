package expo.modules.plennausagestats

/** Processa eventos cronológicos, incluindo contexto anterior, sem persistir histórico. */
internal class ForegroundUsageAccumulator(private val start: Long, private val end: Long) {
  enum class Event { RESUMED, PAUSED, STOPPED, SCREEN_OFF, LOCKED, SHUTDOWN, STARTUP }

  private val activities = mutableMapOf<String, MutableSet<String>>()
  private val openedAt = mutableMapOf<String, Long>()
  private val totals = mutableMapOf<String, Long>()
  private var lastTimestamp = Long.MIN_VALUE
  private var finished = false

  fun accept(type: Event, timestamp: Long, packageName: String? = null, className: String? = null) {
    if (finished || end <= start || timestamp > end || timestamp < lastTimestamp) return
    lastTimestamp = timestamp
    when (type) {
      Event.SCREEN_OFF, Event.LOCKED, Event.SHUTDOWN -> {
        openedAt.keys.toList().forEach { close(it, timestamp) }
        activities.clear()
      }
      Event.STARTUP -> {
        // Sem fechamento anterior ao reinício, não há instante de saída confiável.
        openedAt.clear()
        activities.clear()
      }
      Event.RESUMED -> {
        if (packageName.isNullOrEmpty()) return
        val active = activities.getOrPut(packageName) { mutableSetOf() }
        if (active.isEmpty()) openedAt[packageName] = timestamp
        active.add(className ?: "")
      }
      Event.PAUSED, Event.STOPPED -> {
        if (packageName.isNullOrEmpty()) return
        val active = activities[packageName] ?: return
        active.remove(className ?: "")
        if (active.isEmpty()) {
          close(packageName, timestamp)
          activities.remove(packageName)
        }
      }
    }
  }

  private fun close(packageName: String, timestamp: Long) {
    val opened = openedAt.remove(packageName) ?: return
    val duration = minOf(timestamp, end) - maxOf(opened, start)
    if (duration > 0) totals[packageName] = (totals[packageName] ?: 0L) + duration
  }

  fun finish(): Map<String, Long> {
    if (!finished && end > start) {
      openedAt.keys.toList().forEach { close(it, end) }
      activities.clear()
    }
    finished = true
    // Soma milissegundos primeiro, depois trunca para segundos como no cálculo original.
    return totals.mapValues { (_, milliseconds) -> milliseconds / 1000L }
  }

  companion object {
    const val LOOKBACK_MS = 24 * 60 * 60 * 1000L
    fun queryStart(start: Long): Long = (start - LOOKBACK_MS).coerceAtLeast(0L)
  }
}

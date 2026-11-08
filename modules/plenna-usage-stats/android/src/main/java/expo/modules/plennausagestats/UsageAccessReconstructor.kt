package expo.modules.plennausagestats

/** Reconstrói em uma passagem limitada, sem enviar eventos crus pela ponte nativa. */
internal class UsageAccessReconstructor(
  private val windows: List<Pair<Long, Long>>,
  private val packages: Set<String>,
  private val eligibleFrom: Long,
  private val maxAccesses: Int = 3000
) {
  companion object {
    // OPENING indica início observado; não comprova uma entrada independente.
    const val OPENING = 1
    const val END = 2
    const val OPEN = 4
    const val CONTINUATION = 8
    const val BOUNDARY = 16
    const val GAP = 32
    const val PARTIAL = 64
    const val CLOCK = 128
    const val INDEPENDENT = 256
    const val RESUMPTION = 512
    const val ENTRY_UNKNOWN = 1024
    const val SCREEN_OFF_END = 2048
    const val LOCKED_END = 4096
    const val SOURCE_UNVERIFIED = 8192
  }
  data class Segment(val origin: Long, val start: Long, val end: Long?, val quality: Int)
  private data class Episode(val start: Long, val activities: MutableSet<String>, var pendingEnd: Long? = null, val entry: Int = ENTRY_UNKNOWN, var quality: Int = 0)
  private val active = mutableMapOf<String, Episode>()
  // No Galaxy, o retorno ao foreground pode anteceder KEYGUARD_HIDDEN.
  // Conserva apenas atividades ainda retomadas, sem contar o período bloqueado.
  private val awaitingUnlock = mutableMapOf<String, MutableSet<String>>()
  private val closedActivities = mutableSetOf<String>()
  private val segments = windows.map { mutableMapOf<String, MutableList<Segment>>() }
  private val flags = IntArray(windows.size) { SOURCE_UNVERIFIED } // O Android não certifica a completude dos eventos.
  private var interactive = true
  private var locked = false
  private var foreground: String? = null // Somente em memória; não exporta a identidade de outros aplicativos.
  private var suspended: String? = null
  private var foregroundExited = false
  private var chronologyReliable = true
  private val appFlags = windows.map { mutableMapOf<String,Int>() }
  private fun markApp(time: Long,pkg: String,bit: Int) { mark(time,bit);windows.forEachIndexed { i,w -> if(time>=w.first && time<w.second) appFlags[i][pkg]=(appFlags[i][pkg] ?: 0) or bit } }
  private fun mark(time: Long, bit: Int) { windows.forEachIndexed { i,w -> if(time>=w.first && time<w.second) flags[i]=flags[i] or bit } }
  private var last = Long.MIN_VALUE
  private var size = 0
  private var finished = false
  private val evidenceByWindow = BooleanArray(windows.size)
  val evidence: Boolean get() = evidenceByWindow.any { it }

  fun accept(type: ForegroundUsageAccumulator.Event, time: Long, pkg: String? = null, activity: String? = null) {
    check(!finished)
    if (time < last) { chronologyReliable=false; awaitingUnlock.clear(); mark(time,CLOCK); active.values.forEach { it.quality=it.quality or CLOCK or PARTIAL }; return }
    flushBefore(time)
    last = time
    windows.forEachIndexed { i,w -> if(time>=w.first && time<w.second)evidenceByWindow[i]=true }
    val name = activity ?: ""
    when (type) {
      ForegroundUsageAccumulator.Event.RESUMED -> {
        if (pkg == null || !interactive) return
        if (locked) {
          if (pkg in packages) {
            val waiting = awaitingUnlock.getOrPut(pkg) { mutableSetOf() }
            waiting.add(name)
            if(waiting.size>128)throw IllegalStateException("ACTIVITY_LIMIT")
          }
          return
        }
        resumeForeground(pkg,name,time)
      }
      ForegroundUsageAccumulator.Event.PAUSED, ForegroundUsageAccumulator.Event.STOPPED -> {
        if (pkg != null && awaitingUnlock[pkg]?.remove(name) == true) {
          if(awaitingUnlock[pkg]?.isEmpty() == true)awaitingUnlock.remove(pkg)
          return
        }
        if(pkg != null && pkg == foreground && type == ForegroundUsageAccumulator.Event.PAUSED) foregroundExited = true
        if (pkg !in packages) return
        val p = pkg!!; val current = active[p]
        if (current == null || !current.activities.remove(name)) {
          if ("$p/$name" !in closedActivities && windows.any { time >= it.first && time < it.second })
            markApp(time,p,GAP or PARTIAL)
          return
        }
        closedActivities.add("$p/$name")
        if(closedActivities.size>4096)throw IllegalStateException("ACTIVITY_LIMIT")
        if (current.activities.isEmpty()) current.pendingEnd = time
      }
      ForegroundUsageAccumulator.Event.SCREEN_ON -> { interactive = true }
      ForegroundUsageAccumulator.Event.UNLOCKED -> {
        locked = false; interactive = true
        // Exige um RESUMED anterior ainda ativo: desbloquear sozinho não cria uso.
        // O intervalo começa no desbloqueio observado para excluir o tempo bloqueado.
        val waiting = awaitingUnlock.toMap()
        awaitingUnlock.clear()
        waiting.forEach { (p,names) -> names.forEach { resumeForeground(p,it,time) } }
      }
      ForegroundUsageAccumulator.Event.SCREEN_OFF, ForegroundUsageAccumulator.Event.LOCKED -> {
        suspended = active.maxByOrNull { it.value.start }?.key ?: foreground?.takeIf { it in packages } ?: suspended
        foreground = null; foregroundExited = false
        if(type == ForegroundUsageAccumulator.Event.LOCKED) locked = true else interactive = false
        val reason = if(type == ForegroundUsageAccumulator.Event.LOCKED) LOCKED_END else SCREEN_OFF_END
        active.toMap().forEach { (p,e) -> emit(p,e.start,e.pendingEnd ?: time,END or reason or e.quality,e.entry) }
        active.clear(); closedActivities.clear()
        awaitingUnlock.clear()
      }
      ForegroundUsageAccumulator.Event.SHUTDOWN, ForegroundUsageAccumulator.Event.STARTUP -> {
        // O desligamento não comprova o instante em que o aplicativo deixou de ser usado.
        active.toMap().forEach { (p,e) -> emit(p,e.start,null,OPEN or GAP or PARTIAL,e.entry) }
        active.clear(); closedActivities.clear(); awaitingUnlock.clear(); foreground=null; suspended=null
        mark(time,GAP)
      }
    }
  }
  private fun resumeForeground(p: String, name: String, time: Long) {
    val previous = foreground
    val externalExit = foregroundExited
    if(previous != p)foregroundExited = false
    foreground = p
    if(suspended != null && suspended != p)suspended = null
    if(p !in packages)return
    val episode = active[p]
    if(episode != null && episode.pendingEnd == time)episode.pendingEnd = null
    val current = active.getOrPut(p) {
      val entry = if(!chronologyReliable) ENTRY_UNKNOWN else if(suspended == p) RESUMPTION else if(previous != null && previous != p && externalExit) INDEPENDENT else ENTRY_UNKNOWN
      Episode(time,mutableSetOf(),entry=entry)
    }
    if(suspended == p)suspended = null
    // Os campos públicos não distinguem eventos duplicados de instâncias da mesma classe.
    if(name in current.activities) { current.quality=current.quality or GAP or PARTIAL; mark(time,GAP) }
    current.activities.add(name)
    if(current.activities.size>128)throw IllegalStateException("ACTIVITY_LIMIT")
    closedActivities.remove("$p/$name")
  }
  private fun flushBefore(time: Long) {
    active.toMap().forEach { (p,e) ->
      val end = e.pendingEnd
      if (end != null && end < time) { emit(p,e.start,end,END or e.quality,e.entry); active.remove(p) }
    }
  }
  private fun emit(pkg: String, origin: Long, end: Long?, quality: Int, entry: Int) {
    windows.forEachIndexed { i,w ->
      val begin = maxOf(origin,w.first,eligibleFrom)
      if (begin >= w.second || end != null && end <= begin) return@forEachIndexed
      // Uma nova conta não recebe horários anteriores à sua autorização.
      val authorizedOrigin = maxOf(origin,eligibleFrom)
      val clippedEnd = end?.let { minOf(it,w.second) }
      val opening = if (origin >= eligibleFrom && origin >= w.first) OPENING or entry else CONTINUATION or BOUNDARY or PARTIAL
      val ending = if (end != null && end > w.second) BOUNDARY or CONTINUATION or PARTIAL or (quality and (GAP or CLOCK)) else quality
      val segment = Segment(authorizedOrigin,begin,clippedEnd,opening or ending)
      val list = segments[i].getOrPut(pkg) { mutableListOf() }
      if (list.none { it.origin == segment.origin && it.start == segment.start && it.end == segment.end }) {
        if (++size > maxAccesses) throw IllegalStateException("ACCESS_LIMIT")
        list.add(segment)
      }
    }
  }
  fun finish(): List<Map<String, Any>> {
    check(!finished)
    active.toMap().forEach { (p,e) -> emit(p,e.start,e.pendingEnd,(if (e.pendingEnd == null) OPEN or PARTIAL else END) or e.quality,e.entry) }
    active.clear(); finished = true
    return windows.mapIndexed { i,w ->
      if(!evidenceByWindow[i] && segments[i].values.all { it.isEmpty() }) return@mapIndexed mapOf("sourceStatus" to "UNAVAILABLE","reason" to "SOURCE_UNAVAILABLE")
      mapOf("collectorVersion" to 4, "sourceStatus" to "AVAILABLE", "quality" to (flags[i] or segments[i].values.flatten().fold(0) { n,s -> n or (s.quality and (OPEN or BOUNDARY or GAP or CLOCK or PARTIAL)) }), "applications" to packages.map { pkg ->
        val list = segments[i][pkg] ?: emptyList()
        // Soma a união dos intervalos conhecidos; acessos abertos não recebem fim inventado.
        val known = list.filter { it.end != null }.sortedBy { it.start }
        var total = 0L; var left = 0L; var right = 0L
        known.forEach { s -> if (s.start > right) { total += right-left;left=s.start;right=s.end!! } else right=maxOf(right,s.end!!) }
        total += right-left
        mapOf("packageId" to pkg,"durationMs" to total,"quality" to (SOURCE_UNVERIFIED or (appFlags[i][pkg] ?: 0) or list.fold(0) { n,s -> n or (s.quality and (OPEN or BOUNDARY or GAP or CLOCK or PARTIAL)) }),
          "accesses" to list.map { s -> mapOf("origin" to s.origin,"start" to s.start,"end" to s.end,"quality" to s.quality) })
      })
    }
  }
}

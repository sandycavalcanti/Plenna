package expo.modules.plennausagestats
import expo.modules.plennausagestats.ForegroundUsageAccumulator.Event.*

fun main() {
  val app="com.zzkko"
  fun result(events: (UsageAccessReconstructor)->Unit):List<Map<String,Any>> {
    val r=UsageAccessReconstructor(listOf(1000L to 5000L,5000L to 9000L),setOf(app),1000L)
    events(r);return r.finish()
  }
  @Suppress("UNCHECKED_CAST")
  fun accesses(result:List<Map<String,Any>>,day:Int)=((result[day]["applications"] as List<Map<String,Any>>)[0]["accesses"] as List<Map<String,Any?>>)
  val complete=result { it.accept(RESUMED,2000,app,"A");it.accept(PAUSED,4000,app,"A") }
  check(accesses(complete,0).single()["end"]==4000L)
  val open=result { it.accept(RESUMED,2000,app,"A") }
  check(accesses(open,0).single()["end"]==null)
  val cross=result { it.accept(RESUMED,4000,app,"A");it.accept(PAUSED,6000,app,"A") }
  check(accesses(cross,0).single()["origin"]==accesses(cross,1).single()["origin"])
  check((accesses(cross,1).single()["quality"] as Int and UsageAccessReconstructor.OPENING)==0)
  val duplicate=result { it.accept(RESUMED,2000,app,"A");it.accept(RESUMED,2000,app,"A");it.accept(PAUSED,3000,app,"A");it.accept(STOPPED,3500,app,"A") }
  check(accesses(duplicate,0).size==1)
  val transition=result { it.accept(RESUMED,2000,app,"A");it.accept(PAUSED,3000,app,"A");it.accept(RESUMED,3000,app,"B");it.accept(PAUSED,4000,app,"B") }
  check(accesses(transition,0).size==1)
  val orphan=result { it.accept(PAUSED,3000,app,"A") }
  check(accesses(orphan,0).isEmpty())
  val reboot=result { it.accept(RESUMED,2000,app,"A");it.accept(SHUTDOWN,3000);it.accept(STARTUP,3500) }
  check(accesses(reboot,0).single()["end"]==null)
  val locked=result { it.accept(RESUMED,2000,app,"A");it.accept(LOCKED,3000) }
  check((accesses(locked,0).single()["quality"] as Int and UsageAccessReconstructor.LOCKED_END)!=0)
  val old=result { it.accept(RESUMED,500,app,"A");it.accept(PAUSED,3000,app,"A") }
  check(accesses(old,0).single()["origin"]==1000L)
  val empty=result { it.accept(RESUMED,6000,app,"A");it.accept(PAUSED,7000,app,"A") }
  check(empty[0]["sourceStatus"]=="UNAVAILABLE")
  val clock=result { it.accept(RESUMED,3000,app,"A");it.accept(PAUSED,2000,app,"A") }
  check((clock[0]["quality"] as Int and UsageAccessReconstructor.CLOCK)!=0)
  var limited=false
  try {val r=UsageAccessReconstructor(listOf(1000L to 9000L),setOf(app),1000,1);r.accept(RESUMED,2000,app,"A");r.accept(PAUSED,3000,app,"A");r.accept(RESUMED,4000,app,"A");r.accept(PAUSED,5000,app,"A");r.finish()}catch(_:IllegalStateException){limited=true}
  check(limited)
  fun q(rows:List<Map<String,Any>>, index:Int=0) = accesses(rows,0)[index]["quality"] as Int
  check(q(complete) and UsageAccessReconstructor.PARTIAL == 0)
  check(q(complete) and UsageAccessReconstructor.ENTRY_UNKNOWN != 0)
  fun galaxy(interruption: ForegroundUsageAccumulator.Event) = result {
    it.accept(RESUMED,1100,app,"A");it.accept(interruption,2000)
    it.accept(SCREEN_ON,3000);it.accept(UNLOCKED,3100)
    it.accept(RESUMED,4000,app,"A");it.accept(PAUSED,4500,app,"A")
  }
  val manual=galaxy(LOCKED); val automatic=galaxy(SCREEN_OFF)
  for(rows in listOf(manual,automatic)) {
    check(accesses(rows,0).size==2)
    check(accesses(rows,0)[0]["end"]==2000L)
    check(accesses(rows,0)[1]["start"]==4000L)
    check(accesses(rows,0)[0]["origin"]!=accesses(rows,0)[1]["origin"])
    check(q(rows,1) and UsageAccessReconstructor.RESUMPTION != 0)
    check(q(rows,1) and UsageAccessReconstructor.INDEPENDENT == 0)
    @Suppress("UNCHECKED_CAST")
    check(((rows[0]["applications"] as List<Map<String,Any>>)[0]["durationMs"])==1400L)
  }
  check(manual==galaxy(LOCKED)) // deterministic replay, including interval identities
  val unlockOnly=result { it.accept(RESUMED,1100,app,"A");it.accept(LOCKED,2000);it.accept(UNLOCKED,3000) }
  check(accesses(unlockOnly,0).size==1)
  val switch=result {
    it.accept(RESUMED,1100,app,"A");it.accept(PAUSED,2000,app,"A")
    it.accept(RESUMED,2100,"com.shopee.br","B");it.accept(PAUSED,3000,"com.shopee.br","B")
    it.accept(RESUMED,3100,app,"A");it.accept(PAUSED,4000,app,"A")
  }
  check(q(switch,1) and UsageAccessReconstructor.INDEPENDENT != 0)
  val missing=result { it.accept(RESUMED,1100,app,"A");it.accept(PAUSED,2000,app,"A");it.accept(RESUMED,3000,app,"B");it.accept(PAUSED,4000,app,"B") }
  check(accesses(missing,0).size==2 && q(missing,1) and UsageAccessReconstructor.ENTRY_UNKNOWN != 0)
  val overlap=result { it.accept(RESUMED,1100,app,"A");it.accept(RESUMED,2000,app,"B");it.accept(PAUSED,2100,app,"A");it.accept(PAUSED,4000,app,"B") }
  check(accesses(overlap,0).size==1)
  val short=result { it.accept(RESUMED,1101,app,"A");it.accept(PAUSED,1400,app,"A") }
  check(accesses(short,0).single()["start"]==1101L && accesses(short,0).single()["end"]==1400L)
  val blocked=result { it.accept(LOCKED,1100);it.accept(RESUMED,1200,app,"A");it.accept(UNLOCKED,2000) }
  check(accesses(blocked,0).single()["start"]==2000L)
  check(accesses(blocked,0).single()["end"]==null)
  for(length in listOf(23L,25L)) {
    val end=1000L+length*3600000L
    val r=UsageAccessReconstructor(listOf(1000L to end,end to end+1000),setOf(app),1000)
    r.accept(RESUMED,1100,app,"A");r.accept(PAUSED,end+100,app,"A")
    val rows=r.finish();check(accesses(rows,0).single()["end"]==end)
    check(q(rows) and UsageAccessReconstructor.BOUNDARY != 0)
    check((accesses(rows,1).single()["quality"] as Int) and UsageAccessReconstructor.INDEPENDENT == 0)
  }
  // Galaxy: RESUMED is delivered before KEYGUARD_HIDDEN, not after it.
  val resumeBeforeUnlock=result {
    it.accept(RESUMED,1100,app,"A");it.accept(SCREEN_OFF,2000)
    it.accept(PAUSED,2100,app,"A");it.accept(STOPPED,2200,app,"A");it.accept(LOCKED,2500)
    it.accept(SCREEN_ON,3000);it.accept(RESUMED,3100,app,"A");it.accept(UNLOCKED,3200)
    it.accept(PAUSED,4000,app,"A");it.accept(STOPPED,4100,app,"A")
  }
  check(accesses(resumeBeforeUnlock,0).size==2)
  check(accesses(resumeBeforeUnlock,0)[1]["start"]==3200L)
  check(accesses(resumeBeforeUnlock,0)[1]["end"]==4000L)
  check(q(resumeBeforeUnlock,1) and UsageAccessReconstructor.RESUMPTION != 0)
  check(q(resumeBeforeUnlock,1) and UsageAccessReconstructor.INDEPENDENT == 0)
  @Suppress("UNCHECKED_CAST")
  check((resumeBeforeUnlock[0]["applications"] as List<Map<String,Any>>)[0]["durationMs"]==1700L)
  val missingUnlock=result { it.accept(LOCKED,1100);it.accept(SCREEN_ON,2000);it.accept(RESUMED,2100,app,"A") }
  check(accesses(missingUnlock,0).isEmpty())
  val pausedBeforeUnlock=result { it.accept(LOCKED,1100);it.accept(SCREEN_ON,2000);it.accept(RESUMED,2100,app,"A");it.accept(PAUSED,2200,app,"A");it.accept(UNLOCKED,2300) }
  check(accesses(pausedBeforeUnlock,0).isEmpty())
  val screenOffAgain=result { it.accept(LOCKED,1100);it.accept(SCREEN_ON,2000);it.accept(RESUMED,2100,app,"A");it.accept(SCREEN_OFF,2200);it.accept(UNLOCKED,2300) }
  check(accesses(screenOffAgain,0).isEmpty())
  val repeatedUnlock=result { it.accept(LOCKED,1100);it.accept(SCREEN_ON,2000);it.accept(RESUMED,2100,app,"A");it.accept(UNLOCKED,2200);it.accept(UNLOCKED,2300);it.accept(PAUSED,3000,app,"A") }
  check(accesses(repeatedUnlock,0).size==1 && accesses(repeatedUnlock,0).single()["start"]==2200L)
  // First-return regression: fixtures only, never device events or persistent data.
  fun firstReturn(end: Long, secondUse: Boolean = false, paused: Boolean = true): List<Map<String,Any>> {
    val r=UsageAccessReconstructor(listOf(1000L to end),setOf(app),1000)
    val events=mutableListOf(Triple(RESUMED,1000L,"com.Plenna"),Triple(PAUSED,1200L,"com.Plenna"),Triple(RESUMED,1500L,app))
    if(paused)events.add(Triple(PAUSED,3500L,app))
    if(secondUse)events.addAll(listOf(Triple(RESUMED,4000L,"com.Plenna"),Triple(PAUSED,4500L,"com.Plenna"),Triple(RESUMED,5000L,app),Triple(PAUSED,6000L,app)))
    // UsageStats query end is exclusive; a server clock behind the phone cannot
    // see the pause yet even though it exists in the device's full event stream.
    events.filter { it.second < end }.forEach { r.accept(it.first,it.second,it.third,"A") }
    return r.finish()
  }
  @Suppress("UNCHECKED_CAST")
  fun duration(rows:List<Map<String,Any>>) = ((rows[0]["applications"] as List<Map<String,Any>>)[0]["durationMs"] as Long)
  val justOpened=firstReturn(1400);check(duration(justOpened)==0L)
  val firstClosed=firstReturn(4000);check(duration(firstClosed)==2000L)
  check(accesses(firstClosed,0).size==1 && q(firstClosed) and UsageAccessReconstructor.INDEPENDENT != 0)
  val behindFirst=firstReturn(3400);check(duration(behindFirst)==0L && accesses(behindFirst,0).single()["end"]==null)
  val behindSecond=firstReturn(5900,true);check(duration(behindSecond)==2000L && accesses(behindSecond,0).last()["end"]==null)
  val secondClosed=firstReturn(6500,true);check(duration(secondClosed)==3000L && accesses(secondClosed,0).size==2)
  val withoutAnotherUse=firstReturn(4500);check(duration(withoutAnotherUse)==2000L && accesses(withoutAnotherUse,0)==accesses(firstClosed,0))
  val pauseNotAvailable=firstReturn(4000,paused=false);check(duration(pauseNotAvailable)==0L && q(pauseNotAvailable) and UsageAccessReconstructor.OPEN != 0)
  check(duration(firstReturn(4000))==2000L) // only observed PAUSED closes it
  val noEvents=UsageAccessReconstructor(listOf(1000L to 4000L),setOf(app),1000).finish();check(noEvents[0]["sourceStatus"]=="UNAVAILABLE")
  val lockedFirst=UsageAccessReconstructor(listOf(1000L to 5000L),setOf(app),1000)
  lockedFirst.accept(RESUMED,1500,app,"A");lockedFirst.accept(SCREEN_OFF,2500)
  lockedFirst.accept(SCREEN_ON,4000);lockedFirst.accept(UNLOCKED,4100);lockedFirst.accept(RESUMED,4500,app,"A");lockedFirst.accept(PAUSED,4800,app,"A")
  val lockRows=lockedFirst.finish();check(duration(lockRows)==1300L && q(lockRows,1) and UsageAccessReconstructor.RESUMPTION != 0 && q(lockRows,1) and UsageAccessReconstructor.INDEPENDENT==0)
  check(firstClosed==firstReturn(4000)) // deterministic identity, no duplicated access
  println("Monitoramento de acessos: 37 cenarios aprovados")
}

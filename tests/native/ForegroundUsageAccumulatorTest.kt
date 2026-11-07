package expo.modules.plennausagestats

import expo.modules.plennausagestats.ForegroundUsageAccumulator.Event.*

private const val START = 86_400_000L
private const val END = START + 3_600_000L
private const val APP = "com.exemplo.loja"
private var passed = 0

private fun test(name: String, body: () -> Unit) {
  body()
  passed++
  println("PASS: $name")
}

private fun assertUsage(expected: Map<String, Long>, accumulator: ForegroundUsageAccumulator) {
  val actual = accumulator.finish()
  check(actual == expected) { "Expected $expected, received $actual" }
  check(accumulator.finish() == expected) { "finish duplicated duration" }
}

fun main() {
  test("23:55 -> 00:10 counts only 600 seconds after midnight") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 300_000, APP, "A")
    a.accept(PAUSED, START + 600_000, APP, "A")
    assertUsage(mapOf(APP to 600L), a)
  }
  test("session before window still open at end is clipped to the whole window") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 300_000, APP, "A")
    assertUsage(mapOf(APP to 3600L), a)
  }
  test("session entirely inside window preserves duration") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START + 1000, APP, "A")
    a.accept(PAUSED, START + 11_000, APP, "A")
    assertUsage(mapOf(APP to 10L), a)
  }
  test("overlapping activities are counted as a union, not a sum") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 1000, APP, "A")
    a.accept(RESUMED, START + 2000, APP, "B")
    a.accept(PAUSED, START + 3000, APP, "A")
    a.accept(PAUSED, START + 5000, APP, "B")
    assertUsage(mapOf(APP to 5L), a)
  }
  test("duplicate resumed/paused and late stopped do not duplicate or close another activity") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START, APP, "A")
    a.accept(RESUMED, START + 1000, APP, "A")
    a.accept(RESUMED, START + 2000, APP, "B")
    a.accept(PAUSED, START + 3000, APP, "A")
    a.accept(STOPPED, START + 4000, APP, "A")
    a.accept(PAUSED, START + 5000, APP, "B")
    a.accept(PAUSED, START + 6000, APP, "B")
    assertUsage(mapOf(APP to 5L), a)
  }
  test("paused with no known resumed does not fabricate foreground") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(PAUSED, START + 600_000, APP, "A")
    assertUsage(emptyMap(), a)
  }
  test("closed session in prefix is not carried into window") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 300_000, APP, "A")
    a.accept(PAUSED, START - 1000, APP, "A")
    assertUsage(emptyMap(), a)
  }
  test("missing paused is closed by stopped") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 1000, APP, "A")
    a.accept(STOPPED, START + 7000, APP, "A")
    assertUsage(mapOf(APP to 7L), a)
  }
  for (boundary in listOf(SCREEN_OFF, LOCKED, SHUTDOWN)) {
    test("$boundary closes foreground even without paused") {
      val a = ForegroundUsageAccumulator(START, END)
      a.accept(RESUMED, START - 1000, APP, "A")
      a.accept(boundary, START + 10_000)
      assertUsage(mapOf(APP to 10L), a)
    }
    test("$boundary before window clears initial state") {
      val a = ForegroundUsageAccumulator(START, END)
      a.accept(RESUMED, START - 3000, APP, "A")
      a.accept(boundary, START - 1000)
      a.accept(PAUSED, START + 600_000, APP, "A")
      assertUsage(emptyMap(), a)
    }
  }
  test("new resumed after screen off starts a new interval without counting the gap") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START, APP, "A")
    a.accept(SCREEN_OFF, START + 2000)
    a.accept(RESUMED, START + 8000, APP, "A")
    a.accept(PAUSED, START + 10_000, APP, "A")
    assertUsage(mapOf(APP to 4L), a)
  }
  test("startup discards sessions with unknown closing time") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 1000, APP, "A")
    a.accept(STARTUP, START + 1000)
    a.accept(RESUMED, START + 2000, APP, "A")
    a.accept(PAUSED, START + 4000, APP, "A")
    assertUsage(mapOf(APP to 2L), a)
  }
  test("empty event stream and empty/inverted windows return empty") {
    assertUsage(emptyMap(), ForegroundUsageAccumulator(START, END))
    for (end in listOf(START, START - 1)) {
      val a = ForegroundUsageAccumulator(START, end)
      a.accept(RESUMED, START - 1000, APP, "A")
      assertUsage(emptyMap(), a)
    }
  }
  test("two packages alternating foreground remain independent") {
    val other = "com.exemplo.outra"
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START - 1000, APP, "A")
    a.accept(PAUSED, START + 2000, APP, "A")
    a.accept(RESUMED, START + 2000, other, "A")
    a.accept(PAUSED, START + 5000, other, "A")
    a.accept(RESUMED, START + 5000, APP, "A")
    a.accept(PAUSED, START + 9000, APP, "A")
    assertUsage(mapOf(APP to 6L, other to 3L), a)
  }
  test("adjacent midnight windows split one session without duplicate duration") {
    val before = ForegroundUsageAccumulator(START - 3_600_000, START)
    val after = ForegroundUsageAccumulator(START, END)
    for (a in listOf(before, after)) {
      a.accept(RESUMED, START - 300_000, APP, "A")
      a.accept(PAUSED, START + 600_000, APP, "A")
    }
    assertUsage(mapOf(APP to 300L), before)
    assertUsage(mapOf(APP to 600L), after)
  }
  test("seconds are truncated after summing milliseconds") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(RESUMED, START, APP)
    a.accept(PAUSED, START + 600, APP)
    a.accept(RESUMED, START + 1000, APP)
    a.accept(PAUSED, START + 1600, APP)
    assertUsage(mapOf(APP to 1L), a)
  }
  test("context query is bounded to 24 hours and never negative") {
    check(ForegroundUsageAccumulator.queryStart(START * 3) == START * 2)
    check(ForegroundUsageAccumulator.queryStart(1000) == 0L)
  }
  test("v2 catalog filtering keeps state bounded over 100000 unrelated events") {
    val a = ForegroundUsageAccumulator(START, END, setOf(APP))
    repeat(100000) { a.accept(RESUMED, START + it, "unrelated.$it", "A") }
    a.accept(RESUMED, START + 100000, APP, "A")
    a.accept(PAUSED, START + 101000, APP, "A")
    assertUsage(mapOf(APP to 1L), a)
  }
  test("v2 missing context and estimated closing are explicit quality flags") {
    val a = ForegroundUsageAccumulator(START, END, setOf(APP))
    a.accept(PAUSED, START, APP, "missing")
    a.accept(RESUMED, START + 1000, APP, "A")
    a.finish()
    check(a.qualityFlags.containsAll(listOf("MISSING_CONTEXT", "OPEN_INTERVAL_ESTIMATED")))
  }
  test("v2 reboot gap and clock regression are explicit") {
    val a = ForegroundUsageAccumulator(START, END)
    a.accept(STARTUP, START + 1000)
    a.accept(RESUMED, START, APP, "A")
    check(a.qualityFlags.containsAll(listOf("REBOOT_GAP", "CLOCK_ANOMALY")))
    assertUsage(emptyMap(), a)
  }
  test("v2 partial authorization never counts prefix as eligible usage") {
    val a = ForegroundUsageAccumulator(START + 1800000, END, setOf(APP))
    a.accept(RESUMED, START, APP, "A")
    a.accept(PAUSED, END - 1000, APP, "A")
    assertUsage(mapOf(APP to 1799L), a)
  }
  for (hours in listOf(23L,25L)) test("v2 $hours hour window preserves physical duration") {
    val until = START + hours * 3600000L
    val a = ForegroundUsageAccumulator(START, until)
    a.accept(RESUMED, START - 1, APP, "A")
    assertUsage(mapOf(APP to hours*3600), a)
  }
  test("SHEIN exact package closed session is eligible and unrelated package is excluded") {
    val a = ForegroundUsageAccumulator(START, END, setOf("com.zzkko"))
    a.accept(RESUMED, START, "com.zzkko", "SheinActivity")
    a.accept(PAUSED, START + 12500, "com.zzkko", "SheinActivity")
    a.accept(RESUMED, START + 13000, "other.package", "OtherActivity")
    a.accept(PAUSED, START + 15000, "other.package", "OtherActivity")
    assertUsage(mapOf("com.zzkko" to 12L), a)
  }
  test("SHEIN ongoing session is clipped and marked as estimated") {
    val a = ForegroundUsageAccumulator(START, START + 8000, setOf("com.zzkko"))
    a.accept(RESUMED, START + 1000, "com.zzkko", "A")
    assertUsage(mapOf("com.zzkko" to 7L), a)
    check(a.qualityFlags.contains("OPEN_INTERVAL_ESTIMATED"))
  }
  test("SHEIN subsecond session remains an observed zero and is not rounded up") {
    val a = ForegroundUsageAccumulator(START, END, setOf("com.zzkko"))
    a.accept(RESUMED, START, "com.zzkko", "A")
    a.accept(PAUSED, START + 800, "com.zzkko", "A")
    assertUsage(mapOf("com.zzkko" to 0L), a)
  }
  test("SHEIN before eligibility is not attributed to the new association") {
    val a = ForegroundUsageAccumulator(START, END, setOf("com.zzkko"))
    a.accept(RESUMED, START - 10000, "com.zzkko", "A")
    a.accept(PAUSED, START - 1000, "com.zzkko", "A")
    assertUsage(emptyMap(), a)
  }
  println("$passed Kotlin tests passed")
}

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
  println("$passed Kotlin tests passed")
}

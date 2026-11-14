$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$cacheRoot = Join-Path $env:USERPROFILE '.gradle/caches/modules-2/files-2.1'
$compilerParts = @(
  'org.jetbrains.kotlin/kotlin-compiler-embeddable/2.1.20',
  'org.jetbrains.kotlin/kotlin-stdlib/2.1.20',
  'org.jetbrains.kotlin/kotlin-script-runtime/2.1.20',
  'org.jetbrains.kotlin/kotlin-reflect',
  'org.jetbrains.intellij.deps/trove4j',
  'org.jetbrains.kotlinx/kotlinx-coroutines-core-jvm',
  'org.jetbrains/annotations'
)
$jars = foreach ($part in $compilerParts) {
  $path = Join-Path $cacheRoot $part
  if (Test-Path -LiteralPath $path) {
    Get-ChildItem -LiteralPath $path -Recurse -Filter '*.jar' |
      Where-Object { $_.Name -notmatch '(-sources|-javadoc)\.jar$' } |
      Select-Object -First 1 -ExpandProperty FullName
  }
}
if ($jars.Count -lt 5) { throw 'Kotlin compiler dependencies are not cached; no network download is attempted.' }
$classpath = $jars -join [IO.Path]::PathSeparator
$output = Join-Path $projectRoot 'android/build/usage-monitoring-native-tests'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$source = Join-Path $projectRoot 'modules/plenna-usage-stats/android/src/main/java/expo/modules/plennausagestats/ForegroundUsageAccumulator.kt'
$tests = Join-Path $projectRoot 'tests/native/ForegroundUsageAccumulatorTest.kt'
$accessSource = Join-Path $projectRoot 'modules/plenna-usage-stats/android/src/main/java/expo/modules/plennausagestats/UsageAccessReconstructor.kt'
$accessTests = Join-Path $projectRoot 'tests/native/UsageAccessReconstructorTest.kt'
& java -cp $classpath org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -classpath $classpath -d $output $source $tests $accessSource $accessTests
if ($LASTEXITCODE -ne 0) { throw 'Kotlin test compilation failed' }
& java -cp ($output + [IO.Path]::PathSeparator + $classpath) expo.modules.plennausagestats.ForegroundUsageAccumulatorTestKt
if ($LASTEXITCODE -ne 0) { throw 'Kotlin acceptance tests failed' }
& java -cp ($output + [IO.Path]::PathSeparator + $classpath) expo.modules.plennausagestats.UsageAccessReconstructorTestKt
if ($LASTEXITCODE -ne 0) { throw 'Access reconstruction tests failed' }

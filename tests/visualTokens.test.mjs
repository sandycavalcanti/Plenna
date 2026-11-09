import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('tokens visuais semânticos permanecem definidos na paleta central', () => {
  const colors = read('src/constants/colors.js');

  for (const token of [
    'surfaceAccent',
    'surfaceSegment',
    'surfaceSubtle',
    'borderSubtle',
    'borderSoft',
    'dashboardBodyText',
    'dashboardMutedText',
    'dashboardTrack',
    'dashboardCaution',
    'dashboardDangerSurface',
    'dashboardHero',
    'dashboardShadow',
    'dashboardSheetHandle',
  ]) {
    assert.match(colors, new RegExp(`\\b${token}:`));
  }
});

test('tema do Dashboard não mantém cores literais fora da paleta', () => {
  const theme = read('src/constants/dashboardTheme.js');

  assert.doesNotMatch(theme, /['"]#[0-9A-Fa-f]{3,8}['"]/);
  assert.doesNotMatch(theme, /['"]rgba?\(/);
});

test('componentes visuais comuns usam a hierarquia tipográfica compartilhada', () => {
  for (const file of [
    'src/components/Common/AppScreenHeader/styles.js',
    'src/components/Common/AppFeedback/styles.js',
    'src/components/Common/AppEmptyState/styles.js',
    'src/components/CustomButton/styles.js',
  ]) {
    const source = read(file);
    assert.match(source, /TYPOGRAPHY/);
    assert.match(source, /constants\/typography/);
  }
});

test('superfícies equivalentes das telas compartilhadas referenciam a paleta', () => {
  const files = [
    'src/pages/EditProfileScreen/styles.js',
    'src/pages/MetaDetailsScreen/styles.js',
    'src/pages/MemoryListScreen/index.js',
    'src/pages/SignUpScreen/styles.js',
  ];

  for (const file of files) {
    assert.match(read(file), /COLORS\.surface/);
  }
});

export function metaEstaConcluida(meta) {
  return meta?.meta_completado === true || meta?.concluida === true;
}

export function filtrarMetasNaoConcluidas(metas) {
  return Array.isArray(metas) ? metas.filter((meta) => !metaEstaConcluida(meta)) : [];
}

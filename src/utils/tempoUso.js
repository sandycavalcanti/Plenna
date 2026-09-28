export function filtrarUsoAplicativosCompra(registros = [], aplicativos = []) {
  if (!Array.isArray(registros)) {
    return [];
  }

  const nomesPorPackage = new Map(
    aplicativos.map((app) => [
      app.packageId,
      app.nomeApp,
    ])
  );

  return registros
    .filter((registro) =>
      nomesPorPackage.has(registro.packageName)
    )
    .map((registro) => ({
      aplicativo: nomesPorPackage.get(registro.packageName),
      packageId: registro.packageName,
      durationSeconds: registro.durationSeconds,
    }));
}

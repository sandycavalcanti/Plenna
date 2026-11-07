const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const secret = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
/** Reutiliza a credencial restaurada somente com a mesma âncora privada sem backup. */
export async function installationCredential(previous, anchor, create) {
  if (!uuid(anchor)) throw new Error('RF017_NATIVE_ANCHOR_INVALID');
  if (previous?.anchor === anchor && uuid(previous.id) && secret(previous.secret)) return {
    value: previous,
    created: false
  };
  const candidate = await create();
  if (!uuid(candidate?.id) || !secret(candidate?.secret)) throw new Error('RF017_INSTALLATION_ENTROPY_INVALID');
  return {
    value: {
      id: candidate.id,
      secret: candidate.secret,
      anchor,
      needsNewEpisode: true
    },
    created: true
  };
}

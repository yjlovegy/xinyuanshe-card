export function resolveUserName(fallbackName: string) {
  const contextName = SillyTavern.name1?.trim();
  const personaName = getCurrentPersonaName()?.trim();
  const fallback = fallbackName?.trim();

  if (contextName) return contextName;
  if (personaName) return personaName;
  if (fallback && !['<user>', '主角'].includes(fallback)) return fallback;
  return '玩家';
}

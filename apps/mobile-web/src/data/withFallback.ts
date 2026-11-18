import type { RuleSet, RulesSource } from './sources';

/** primary가 실패하면 fallback을 씁니다(fail-open). onError로 실패만 알립니다(입력값은 담지 않음). */
export function withFallback(
  primary: RulesSource,
  fallback: RulesSource,
  onError?: (error: unknown) => void,
): RulesSource {
  return {
    async getRuleSet(): Promise<RuleSet> {
      try {
        return await primary.getRuleSet();
      } catch (error) {
        onError?.(error);
        return fallback.getRuleSet();
      }
    },
  };
}

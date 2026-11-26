import type { HomeAnswers } from './answers';
import { ChoiceGroup, Question } from './fields';
import { SIDOS, sidoOf, type SidoId, type ZoneId } from './zones';

/**
 * 구입자금 지역: 시·도 → (필요하면) 세부 지역.
 * 수도권 여부(region)도 여기서 함께 정해 LTV와 규제지역 질문에 씁니다.
 * 세부 지역은 한도에서 빼는 소액임차보증금을 정합니다.
 */
export function ZoneField({
  home,
  onChange,
}: {
  home: HomeAnswers;
  onChange: (patch: Partial<HomeAnswers>) => void;
}) {
  const sido = home.sido && home.sido !== 'unknown' ? sidoOf(home.sido) : undefined;

  const pickSido = (v: SidoId | 'unknown' | null) => {
    if (v === null) return;
    if (v === 'unknown') {
      onChange({ sido: 'unknown', zone: 'unknown', region: 'unknown' });
      return;
    }
    const s = sidoOf(v);
    if (!s) return;
    onChange({
      sido: v,
      region: s.metro ? 'metro' : 'local',
      zone: s.zone ?? null,
      // 수도권이면 규제지역 질문이 없으므로 답을 지웁니다.
      ...(s.metro ? { regulated: null } : {}),
    });
  };

  return (
    <>
      <Question label="어느 지역인가요?" term="smallTenantDeposit">
        <ChoiceGroup
          columns={2}
          value={home.sido}
          onChange={pickSido}
          options={SIDOS.map((s) => ({ value: s.id, label: s.label }))}
        />
      </Question>
      {sido?.zones && (
        <Question label={`${sido.label}의 어디인가요?`}>
          <ChoiceGroup
            value={home.zone}
            onChange={(v: ZoneId | 'unknown' | null) => v !== null && onChange({ zone: v })}
            options={sido.zones.map((z) => ({ value: z.id, label: z.label }))}
          />
        </Question>
      )}
    </>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { evaluate, type RuleSet } from '@jipgak/rules-engine';
import { ResultCard } from '../../components/ResultCard';
import { ALL_ZONE_IDS } from '../wizard/zones';
import { todayISO } from '../../format';
import { BASE_FORM, PRESETS, toProfile, type FormState, type Tri } from './form';

/**
 * 판정 테스트 화면 (개발용). 입력을 바꾸면 기기 안의 엔진으로 즉시 다시 판정합니다.
 * 입력값은 어디에도 보내거나 저장하지 않습니다.
 */
export function Playground({ ruleSet }: { ruleSet: RuleSet }) {
  const [form, setForm] = useState<FormState>(BASE_FORM);
  const [presetId, setPresetId] = useState('P01');

  const results = useMemo(() => {
    const profile = toProfile(form);
    return ruleSet.rules.map((rule) => {
      try {
        return { rule, result: evaluate(rule, profile, { asOf: form.asOf }) };
      } catch (error) {
        return { rule, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }, [form, ruleSet]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    setPresetId(id);
    if (preset) setForm({ ...BASE_FORM, ...preset.patch });
  };

  const text = (key: keyof FormState, label: string, placeholder = '모름이면 비우기') => (
    <Field label={label}>
      <input
        className="w-full rounded border border-slate-300 px-2 py-1"
        inputMode="decimal"
        placeholder={placeholder}
        value={String(form[key])}
        onChange={(e) => set(key, e.target.value as never)}
      />
    </Field>
  );

  const triSelect = (key: keyof FormState, label: string) => (
    <Field label={label}>
      <select
        className="w-full rounded border border-slate-300 px-2 py-1"
        value={String(form[key])}
        onChange={(e) => set(key, e.target.value as Tri as never)}
      >
        <option value="yes">예</option>
        <option value="no">아니오</option>
        <option value="unknown">모름</option>
      </select>
    </Field>
  );

  const metroSelect = (key: 'purchaseMetro' | 'jeonseMetro') => (
    <Field label="지역">
      <select
        className="w-full rounded border border-slate-300 px-2 py-1"
        value={form[key] ? 'metro' : 'local'}
        onChange={(e) => set(key, e.target.value === 'metro')}
      >
        <option value="metro">수도권</option>
        <option value="local">수도권 외</option>
      </select>
    </Field>
  );

  return (
    <section className="space-y-5">
      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
        개발용 테스트 화면입니다. 금액은 <b>만 원</b> 단위이고, 칸을 비우거나 &lsquo;모름&rsquo;을
        고르면 입력하지 않은 것으로 판정합니다.
      </div>

      <Field label="골든 케이스 불러오기">
        <select
          className="w-full rounded border border-slate-300 px-2 py-1"
          value={presetId}
          onChange={(e) => applyPreset(e.target.value)}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Group title="기본 정보">
        <Field label="판정 기준일" wide>
          <div className="flex gap-2">
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-2 py-1"
              value={form.asOf}
              onChange={(e) => set('asOf', e.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded border border-slate-300 px-2 text-xs"
              onClick={() => set('asOf', todayISO())}
            >
              오늘
            </button>
          </div>
        </Field>
        <Field label="혼인 상태">
          <select
            className="w-full rounded border border-slate-300 px-2 py-1"
            value={form.marriageStatus}
            onChange={(e) => set('marriageStatus', e.target.value as FormState['marriageStatus'])}
          >
            <option value="married">기혼 (혼인신고일)</option>
            <option value="planned">결혼 예정 (예정일)</option>
          </select>
        </Field>
        <Field label={form.marriageStatus === 'married' ? '혼인신고일' : '결혼 예정일'}>
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-2 py-1"
            value={form.marriageDate}
            onChange={(e) => set('marriageDate', e.target.value)}
          />
        </Field>
        {text('applicantIncome', '신청인 연소득 (만 원)')}
        {text('spouseIncome', '배우자 연소득 (만 원)')}
        {text('netAssets', '부부합산 순자산 (만 원)')}
        {text('childrenCount', '자녀 수', '0')}
      </Group>

      <Group title="주택·대출 이력">
        {triSelect('allHomeless', '세대원 전원 무주택')}
        {triSelect('everOwnedHome', '주택 보유 이력 있음')}
        {triSelect('everHadFundPurchaseLoan', '기금 구입·중도금 대출 이력 (상환 포함)')}
        {triSelect('hasFundLoan', '기금대출 이용 중')}
        {triSelect('hasMortgageLoan', '은행 주택담보대출 이용 중')}
        {triSelect('hasJeonseLoan', '은행 전세자금대출 이용 중')}
        {triSelect('livesInPublicRental', '공공임대 거주 중')}
      </Group>

      <Group title="구입하려는 집">
        {metroSelect('purchaseMetro')}
        {triSelect('purchaseRegulated', '규제지역')}
        <Field label="세부 지역 코드 (소액임차보증금)">
          <select
            className="w-full rounded border border-slate-300 px-2 py-1"
            value={form.purchaseZone}
            onChange={(e) => set('purchaseZone', e.target.value)}
          >
            <option value="">모름 (최대 공제)</option>
            {ALL_ZONE_IDS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </Field>
        {text('purchasePrice', '매매가 (만 원)')}
        {text('purchaseArea', '전용면적 (㎡)')}
        {triSelect('purchaseContract', '매매계약 체결')}
      </Group>

      <Group title="전세로 들어갈 집">
        {metroSelect('jeonseMetro')}
        {text('jeonseDeposit', '보증금 (만 원)')}
        {text('jeonseArea', '전용면적 (㎡)')}
        {triSelect('jeonseContract', '임대차계약 체결 + 보증금 5% 지불')}
      </Group>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">판정 결과</h2>
        {results.map((r) =>
          'result' in r && r.result ? (
            <ResultCard key={r.rule.id} rule={r.rule} result={r.result} />
          ) : (
            <p key={r.rule.id} className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {r.rule.name}: 판정 오류 — {'error' in r ? r.error : ''}
            </p>
          ),
        )}
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block min-w-0 space-y-1 text-xs text-slate-600 ${wide ? 'col-span-2' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

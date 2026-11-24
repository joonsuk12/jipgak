import type { ReactNode } from 'react';
import {
  type Answers,
  asksRuralTownship,
  type HomeAnswers,
  type StepId,
  wantsJeonse,
  wantsPurchase,
} from './answers';
import { todayISO } from '../../format';
import { AreaField } from './AreaField';
import { AssetHelper } from './AssetHelper';
import { ChoiceGroup, DateField, Help, NumberField, Question } from './fields';

/** 단계별 제목(질문)과 진행 표시용 짧은 이름 */
export const STEP_META: Record<StepId, { title: string; short: string }> = {
  purpose: { title: '어떤 대출을 알아보세요?', short: '목적' },
  marriage: { title: '혼인신고를 하셨나요?', short: '혼인' },
  income: { title: '두 분의 1년 소득을 알려 주세요', short: '소득' },
  assets: { title: '두 분의 순자산은 얼마인가요?', short: '자산' },
  history: { title: '집과 대출 이력을 확인할게요', short: '이력' },
  purchaseHome: { title: '살 집을 알려 주세요', short: '살 집' },
  jeonseHome: { title: '전세로 들어갈 집을 알려 주세요', short: '전세 집' },
  result: { title: '판정 결과예요', short: '결과' },
};

/** 용어집에 없는 질문별 안내. 용어 안내는 Question의 term으로 docs/GLOSSARY.md에서 가져옵니다(D-16). */
const HINT = {
  plannedDate: '결혼 예정일 기준으로 판정해요. 대출 후 배우자가 함께 올라간 등본을 내야 해요.',
  fundPurchaseLoan: '다 갚은 대출도 포함해요. 받은 적이 있으면 생애최초가 아니에요.',
  children: '금리 우대에만 쓰여요.',
} as const;

const YES_NO_HAVE = [
  { value: 'yes' as const, label: '있어요' },
  { value: 'no' as const, label: '없어요' },
];
const YES_NO_USE = [
  { value: 'yes' as const, label: '써요' },
  { value: 'no' as const, label: '안 써요' },
];

interface StepProps {
  a: Answers;
  update: (patch: Partial<Answers>) => void;
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="space-y-9">{children}</div>;
}

export function PurposeStep({ a, update }: StepProps) {
  return (
    <Stack>
      <Question
        label="알아볼 대출"
        hideLabel
        term="fund"
        hint="주택도시기금의 신혼부부 전용 대출로 판정해요."
      >
        <ChoiceGroup
          allowUnknown={false}
          value={a.purpose}
          onChange={(v) => v !== 'unknown' && v !== null && update({ purpose: v })}
          options={[
            { value: 'purchase', label: '집을 살 거예요 (구입자금)' },
            { value: 'jeonse', label: '전세로 들어갈 거예요 (전세자금)' },
            { value: 'both', label: '둘 다 비교해 볼래요' },
          ]}
        />
      </Question>
      <p className="text-sm leading-6 text-ink-soft">
        모르는 항목은 &lsquo;모름&rsquo;을 고르면 돼요.
      </p>
    </Stack>
  );
}

export function MarriageStep({ a, update }: StepProps) {
  const planned = a.marriageStatus === 'planned';
  return (
    <Stack>
      <Question label="혼인 상태" hideLabel>
        <ChoiceGroup
          allowUnknown={false}
          value={a.marriageStatus}
          onChange={(v) => (v === 'married' || v === 'planned') && update({ marriageStatus: v })}
          options={[
            { value: 'married', label: '네, 했어요' },
            { value: 'planned', label: '아직이요, 결혼 예정이에요' },
          ]}
        />
      </Question>
      {a.marriageStatus && (
        <Question
          label={planned ? '결혼 예정일' : '혼인신고일'}
          {...(planned ? { hint: HINT.plannedDate } : { term: 'marriagePeriod' as const })}
        >
          <DateField
            label={planned ? '결혼 예정일' : '혼인신고일'}
            value={a.marriageDate}
            onChange={(v) => update({ marriageDate: v })}
          />
          {!planned && a.marriageDate && a.marriageDate > todayISO() && (
            <p role="status" className="bg-amber-soft px-3 py-2 text-sm leading-6 text-ink">
              혼인신고일이 오늘 이후예요. 날짜를 확인하거나, 아직 신고 전이라면 위에서
              &lsquo;아직이요, 결혼 예정이에요&rsquo;를 골라 주세요.
            </p>
          )}
          {planned && a.marriageDate && a.marriageDate < todayISO() && (
            <p role="status" className="bg-amber-soft px-3 py-2 text-sm leading-6 text-ink">
              예정일이 지났어요. 혼인신고를 했다면 위에서 &lsquo;네, 했어요&rsquo;를 골라 주세요.
            </p>
          )}
        </Question>
      )}
      <Question label="자녀" hint={HINT.children}>
        <ChoiceGroup
          columns={2}
          value={a.children}
          onChange={(v) => update({ children: v })}
          options={[
            { value: '0', label: '없어요' },
            { value: '1', label: '1명' },
            { value: '2', label: '2명' },
            { value: '3', label: '3명 이상' },
          ]}
        />
      </Question>
    </Stack>
  );
}

export function IncomeStep({ a, update }: StepProps) {
  return (
    <Stack>
      <Help term="combinedIncome" />
      <Question label="대출을 신청할 분의 연소득" term="singleIncome">
        <NumberField
          label="신청할 분의 연소득"
          unit="만 원"
          value={a.applicantIncome}
          onChange={(v) => update({ applicantIncome: v })}
        />
      </Question>
      <Question label={a.marriageStatus === 'planned' ? '예비 배우자의 연소득' : '배우자의 연소득'}>
        <NumberField
          label="배우자의 연소득"
          unit="만 원"
          value={a.spouseIncome}
          onChange={(v) => update({ spouseIncome: v })}
        />
      </Question>
    </Stack>
  );
}

export function AssetsStep({ a, update }: StepProps) {
  return (
    <Stack>
      <Question label="부부 합산 순자산" hideLabel term="netAssets">
        <NumberField
          label="부부 합산 순자산"
          unit="만 원"
          value={a.netAssets}
          onChange={(v) => update({ netAssets: v })}
        />
      </Question>
      <AssetHelper
        values={a.assetItems}
        current={a.netAssets}
        onChange={(assetItems) => update({ assetItems })}
        onApply={(netAssets) => update({ netAssets })}
      />
    </Stack>
  );
}

export function HistoryStep({ a, update }: StepProps) {
  const purchase = wantsPurchase(a);
  const jeonse = wantsJeonse(a);
  return (
    <Stack>
      <Question label="등본에 함께 있는 가족 모두 집이 없나요?" term="homeless">
        <ChoiceGroup
          value={a.allHomeless}
          onChange={(v) => update({ allHomeless: v })}
          options={[
            { value: 'yes', label: '네, 모두 없어요' },
            { value: 'no', label: '집이 있는 사람이 있어요' },
          ]}
        />
      </Question>
      {purchase && (
        <Question label="가족 중 집을 가져 본 적이 있나요?" term="firstHome">
          <ChoiceGroup
            columns={3}
            value={a.everOwnedHome}
            onChange={(v) => update({ everOwnedHome: v })}
            options={YES_NO_HAVE}
          />
        </Question>
      )}
      {purchase && (
        <Question
          label="주택도시기금 구입·중도금 대출을 받은 적이 있나요?"
          term="firstHome"
          hint={HINT.fundPurchaseLoan}
        >
          <ChoiceGroup
            columns={3}
            value={a.everHadFundPurchaseLoan}
            onChange={(v) => update({ everHadFundPurchaseLoan: v })}
            options={YES_NO_HAVE}
          />
        </Question>
      )}
      <Question
        label="지금 주택도시기금 대출(디딤돌·버팀목 등)을 쓰고 있나요?"
        term="duplicateLoan"
      >
        <ChoiceGroup
          columns={3}
          value={a.hasFundLoan}
          onChange={(v) => update({ hasFundLoan: v })}
          options={YES_NO_USE}
        />
      </Question>
      <Question label="지금 은행 주택담보대출을 쓰고 있나요?">
        <ChoiceGroup
          columns={3}
          value={a.hasMortgageLoan}
          onChange={(v) => update({ hasMortgageLoan: v })}
          options={YES_NO_USE}
        />
      </Question>
      {jeonse && (
        <Question label="지금 은행 전세자금대출을 쓰고 있나요?">
          <ChoiceGroup
            columns={3}
            value={a.hasJeonseLoan}
            onChange={(v) => update({ hasJeonseLoan: v })}
            options={YES_NO_USE}
          />
        </Question>
      )}
      {jeonse && (
        <Question
          label="지금 공공임대주택에 살고 있나요?"
          term="publicRental"
          hint="새로 들어갈 집이 그 공공임대주택이거나, 이사 나가는 경우는 괜찮아요."
        >
          <ChoiceGroup
            columns={3}
            value={a.livesInPublicRental}
            onChange={(v) => update({ livesInPublicRental: v })}
            options={[
              { value: 'yes', label: '살아요' },
              { value: 'no', label: '아니에요' },
            ]}
          />
        </Question>
      )}
    </Stack>
  );
}

function HomeStep({
  home,
  onChange,
  kind,
}: {
  home: HomeAnswers;
  onChange: (patch: Partial<HomeAnswers>) => void;
  kind: 'purchase' | 'jeonse';
}) {
  const purchase = kind === 'purchase';
  return (
    <Stack>
      <Question label="지역">
        <ChoiceGroup
          value={home.region}
          onChange={(v) => onChange({ region: v })}
          options={[
            { value: 'metro', label: '수도권 (서울·인천·경기)' },
            { value: 'local', label: '그 외 지역' },
          ]}
        />
      </Question>
      {purchase && home.region === 'local' && (
        <Question label="규제지역인가요?" term="regulated">
          <ChoiceGroup
            columns={3}
            value={home.regulated}
            onChange={(v) => onChange({ regulated: v })}
            options={[
              { value: 'yes', label: '맞아요' },
              { value: 'no', label: '아니에요' },
            ]}
          />
        </Question>
      )}
      <Question label={purchase ? '매매가' : '전세 보증금'} term={purchase ? 'price' : 'deposit'}>
        <NumberField
          label={purchase ? '매매가' : '전세 보증금'}
          unit="만 원"
          value={home.amount}
          onChange={(v) => onChange({ amount: v })}
        />
      </Question>
      <Question label="전용면적" term="area">
        <AreaField value={home.area} onChange={(v) => onChange({ area: v })} />
      </Question>
      {asksRuralTownship(home) && (
        <Question label="도시지역이 아닌 읍·면에 있나요?" term="ruralTownship">
          <ChoiceGroup
            columns={3}
            value={home.ruralTownship}
            onChange={(v) => onChange({ ruralTownship: v })}
            options={[
              { value: 'yes', label: '네' },
              { value: 'no', label: '아니에요' },
            ]}
          />
        </Question>
      )}
      <Question
        label={purchase ? '매매계약을 했나요?' : '임대차계약을 하고 보증금의 5% 이상을 냈나요?'}
        term="contract"
      >
        <ChoiceGroup
          columns={3}
          value={home.contract}
          onChange={(v) => onChange({ contract: v })}
          options={[
            { value: 'yes', label: '했어요' },
            { value: 'no', label: '아직이요' },
          ]}
        />
      </Question>
    </Stack>
  );
}

export function PurchaseHomeStep({ a, update }: StepProps) {
  return (
    <HomeStep
      kind="purchase"
      home={a.purchase}
      onChange={(patch) => update({ purchase: { ...a.purchase, ...patch } })}
    />
  );
}

export function JeonseHomeStep({ a, update }: StepProps) {
  return (
    <HomeStep
      kind="jeonse"
      home={a.jeonse}
      onChange={(patch) => update({ jeonse: { ...a.jeonse, ...patch } })}
    />
  );
}

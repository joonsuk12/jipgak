import { parseDuration, shiftDate, type Rule } from '@jipgak/rules-engine';
import { formatDateKo } from '../../format';

/**
 * 결과 화면 위·아래 안내 (D-26 ④⑥, R2-Q3).
 * 링크·전화·기한은 원문 페이지에서 확인한 것만 씁니다(docs/STATUS.md 3단계 메모, sources/*.md 신청 시기).
 */
const PORTAL = 'https://nhuf.molit.go.kr';

const PRODUCT_GUIDE: Record<
  string,
  { short: string; deadline: string; documents: string; calculator: string }
> = {
  'loan-newlywed-purchase': {
    short: '구입자금',
    deadline: '소유권이전등기 전에 신청해요. 등기를 마쳤다면 등기 접수일부터 3개월 안에요.',
    documents: `${PORTAL}/FP/FP05/FP0503/FP05030602.jsp`,
    calculator: `${PORTAL}/FP/FP08/FP0801/FP08010201.jsp`,
  },
  'loan-newlywed-jeonse': {
    short: '전세자금',
    deadline:
      '임대차계약서의 잔금일과 전입일 중 빠른 날부터 3개월 안에 신청해요. HF·HUG 보증도 기한 안에 따로 신청해요.',
    documents: `${PORTAL}/FP/FP05/FP0502/FP05020402.jsp`,
    calculator: `${PORTAL}/FP/FP08/FP0801/FP08010101.jsp`,
  },
};

/** 출처 확인일부터 이 기간이 지나면 경고 (분기 재검증 D-17 + 한 달 여유, D-26 ⑥) */
const STALE_AFTER = 'P4M';

export function isStale(rule: Rule, today: string): boolean {
  return shiftDate(rule.source.checkedAt, parseDuration(STALE_AFTER), 1) < today;
}

export function ResultIntro({ rules, today }: { rules: Rule[]; today: string }) {
  const stale = rules.filter((r) => isStale(r, today));
  return (
    <div className="space-y-3">
      {stale.length > 0 && (
        <p role="alert" className="bg-amber-soft px-3 py-2 text-sm leading-6 text-ink">
          기준을 확인한 지 오래됐어요(
          {stale.map((r) => `${r.name} ${formatDateKo(r.source.checkedAt)}`).join(', ')}). 그사이
          정책이 바뀌었을 수 있으니 원문과 함께 확인하세요.
        </p>
      )}
      <p className="text-sm leading-6 text-ink-soft">
        집각은 1차 판정이에요. 정확한 한도와 상환액은 공식 계산 마법사와 수탁은행에서 확인하세요.
      </p>
    </div>
  );
}

export function ApplyGuide({ ruleIds }: { ruleIds: string[] }) {
  const guides = ruleIds.flatMap((id) => {
    const g = PRODUCT_GUIDE[id];
    return g ? [g] : [];
  });
  if (guides.length === 0) return null;
  const link = 'font-medium text-pine underline underline-offset-2';

  return (
    <section className="space-y-5 border-t-2 border-ink pt-5">
      <h3 className="font-serif text-xl leading-7 font-bold">신청하려면</h3>
      <ol className="space-y-4 text-[15px] leading-6">
        <li className="flex gap-3">
          <span className="font-serif font-bold text-pine">1</span>
          <span>
            {`집을 정하고 ${
              ruleIds.includes('loan-newlywed-purchase')
                ? ruleIds.includes('loan-newlywed-jeonse')
                  ? '매매계약이나 임대차계약을'
                  : '매매계약을'
                : '임대차계약을'
            } 해요.`}
            {ruleIds.includes('loan-newlywed-jeonse') &&
              ' 전세는 보증금의 5% 이상을 내야 신청할 수 있어요.'}
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-serif font-bold text-pine">2</span>
          <span className="space-y-1">
            <span className="block">기한 안에 신청해요.</span>
            {guides.map((g) => (
              <span key={g.short} className="block text-sm text-ink-soft">
                {g.short}: {g.deadline}
              </span>
            ))}
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-serif font-bold text-pine">3</span>
          <span>
            <a className={link} href="https://enhuf.molit.go.kr" target="_blank" rel="noreferrer">
              기금e든든
            </a>
            에서 비대면으로 신청하거나 수탁은행 영업점에 가요.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-serif font-bold text-pine">4</span>
          <span className="space-y-1">
            <span className="block">필요한 서류를 준비해요.</span>
            {guides.map((g) => (
              <a
                key={g.short}
                className={`${link} block text-sm`}
                href={g.documents}
                target="_blank"
                rel="noreferrer"
              >
                {g.short} 이용절차와 제출서류 (기금 포털)
              </a>
            ))}
          </span>
        </li>
      </ol>

      <div className="space-y-2 text-sm leading-6">
        {guides.map((g) => (
          <a
            key={g.short}
            className={`${link} block`}
            href={g.calculator}
            target="_blank"
            rel="noreferrer"
          >
            공식 계산 마법사에서 {g.short} 상환액까지 계산해 보기
          </a>
        ))}
        <p className="text-ink-soft">
          대출 심사 상담: 주택도시기금 콜센터{' '}
          <a className={link} href="tel:1566-9009">
            1566-9009
          </a>{' '}
          또는 수탁은행
        </p>
      </div>

      <p className="border-l-2 border-rule pl-3 text-sm leading-6 text-ink-soft">
        토지임대부 분양주택, 쉐어하우스·기숙사, 기존 버팀목 대출 갈아타기(대환), 전세 갱신계약은
        기준이 달라 이 결과가 맞지 않을 수 있어요.
      </p>
      <p className="text-sm leading-6 text-ink-soft">
        참고용 결과예요. 실제 자격과 한도는 기금 수탁은행 심사로 정해져요. 집각은 정책 원문을 옮겨
        판정하지만 오류가 있을 수 있고, 이 결과로 생긴 손해를 책임지지 않아요. 정책은 바뀔 수 있으니
        신청 전에 원문과 수탁은행에서 꼭 확인하세요.
      </p>
      <p className="text-sm leading-6 text-ink-soft">
        입력한 내용은 이 기기에만 저장돼요.{' '}
        <a className={link} href="#/privacy">
          개인정보 처리방침
        </a>
      </p>
    </section>
  );
}

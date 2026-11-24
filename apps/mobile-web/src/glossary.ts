import raw from '../../../docs/GLOSSARY.md?raw';

/**
 * 화면 도움말 데이터. 원본은 docs/GLOSSARY.md 하나이고(D-16), 빌드 때 그대로 읽어 옵니다.
 * - `**용어** ★` 다음 줄들: `: 💬 ...` = 한 줄 안내, `: 집각에서는: ...` = 개발자 메모(버림), 나머지 `: ...` = 상세
 */
export interface GlossaryEntry {
  term: string;
  /** ★: 한 줄 안내를 화면에 항상 보여 줄 용어 */
  starred: boolean;
  hint: string;
  /** "자세히"에서 보여 줄 문단. `**굵게**` 표시는 남겨 둡니다. */
  detail: string[];
}

const HEADING = /^\*\*(.+?)\*\*( ★)?\s*$/;

/** 화면에 보이면 안 되는 개발자용 표시(파일 경로, 필드명, 결정 번호)를 지웁니다. */
function cleanDetail(text: string): string {
  return text
    .replace(/\s*자세한 기준:\s*`[^`]*`/g, '')
    .replace(/\s*\([^)]*`[^)]*\)/g, '')
    .replace(/\s*\(D-\d+\)/g, '')
    .trim();
}

export function parseGlossary(md: string): Map<string, GlossaryEntry> {
  const entries = new Map<string, GlossaryEntry>();
  let current: GlossaryEntry | null = null;
  for (const line of md.split(/\r?\n/)) {
    const heading = HEADING.exec(line);
    if (heading?.[1]) {
      current = { term: heading[1], starred: Boolean(heading[2]), hint: '', detail: [] };
      entries.set(current.term, current);
      continue;
    }
    if (!current) continue;
    if (!line.startsWith(': ')) {
      if (line.trim() !== '') current = null;
      continue;
    }
    const body = line.slice(2).trim();
    if (body.startsWith('💬')) current.hint = body.replace(/^💬\s*/, '');
    else if (!body.startsWith('집각에서는')) {
      const cleaned = cleanDetail(body);
      if (cleaned) current.detail.push(cleaned);
    }
  }
  return entries;
}

export const GLOSSARY = parseGlossary(raw);

/** 화면에서 쓰는 용어. 이름은 GLOSSARY.md의 제목과 정확히 같아야 합니다(test/glossary.test.ts). */
export const TERM = {
  marriagePeriod: '혼인기간',
  homeless: '무주택',
  firstHome: '생애최초',
  combinedIncome: '부부합산 연소득',
  singleIncome: '1인 소득 기준 신청',
  netAssets: '순자산',
  area: '전용면적',
  regulated: '규제지역',
  ruralTownship: '도시지역이 아닌 읍·면',
  price: '매매가 / 담보 평가액',
  deposit: '임차보증금(전세금)',
  duplicateLoan: '중복대출 금지',
  publicRental: '공공임대주택',
  contract: '매매·임대차 계약 체결',
  fund: '주택도시기금',
  estimate: '예상 한도 / 예상 금리',
  ltv: 'LTV (Loan To Value, 담보인정비율)',
  preferentialRate: '우대금리',
  manualCheck: '직접 확인할 항목',
  status: '가능 / 확인 필요 / 불가',
} as const;

export type TermKey = keyof typeof TERM;

export function glossary(key: TermKey): GlossaryEntry {
  const entry = GLOSSARY.get(TERM[key]);
  if (!entry) throw new Error(`용어집에 없는 용어: ${TERM[key]}`);
  return entry;
}

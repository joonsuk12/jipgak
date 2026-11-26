/**
 * 구입자금 세부 지역 선택 (소액임차보증금 공제용, 2026-11-26).
 * 지역 코드는 규칙 JSON `lookups.smallTenantDeposit.values`의 키와 같아야 합니다(test/wizard.test.ts가 확인).
 * 금액은 규칙 JSON에만 있고, 여기에는 화면 문구와 수도권 여부만 둡니다.
 * 구분 원본: 공식 계산 마법사 "소액임차보증금 안내 및 입주예정지역 선택" 표(docs/sources/official-calculator-check.md)
 */
export type SidoId = 'seoul' | 'incheon' | 'gyeonggi' | 'sejong' | 'metroCity' | 'other';

export type ZoneId =
  | 'seoul'
  | 'incheon-ganghwa-ongjin'
  | 'incheon-special'
  | 'incheon-other'
  | 'gyeonggi-overcrowded'
  | 'gyeonggi-2800'
  | 'siheung-banwol'
  | 'siheung-other'
  | 'namyangju-listed'
  | 'namyangju-other'
  | 'gyeonggi-other'
  | 'sejong'
  | 'metro-city'
  | 'metro-city-county'
  | 'other';

export interface Sido {
  id: SidoId;
  label: string;
  /** 수도권(서울·인천·경기) */
  metro: boolean;
  /** 세부 선택이 없으면 바로 정해지는 지역 코드 */
  zone?: ZoneId;
  /** 세부 선택지 */
  zones?: { id: ZoneId; label: string }[];
}

export const SIDOS: Sido[] = [
  { id: 'seoul', label: '서울', metro: true, zone: 'seoul' },
  {
    id: 'incheon',
    label: '인천',
    metro: true,
    zones: [
      { id: 'incheon-ganghwa-ongjin', label: '강화군·옹진군' },
      {
        id: 'incheon-special',
        label:
          '서구 대곡·불로·마전·금곡·오류·왕길·당하·원당동, 인천경제자유구역, 남동 국가산업단지',
      },
      { id: 'incheon-other', label: '그 밖의 인천' },
    ],
  },
  {
    id: 'gyeonggi',
    label: '경기',
    metro: true,
    zones: [
      {
        id: 'gyeonggi-overcrowded',
        label: '의정부·구리·하남·고양·수원·성남·안양·부천·광명·과천·의왕·군포·용인·화성·김포',
      },
      { id: 'gyeonggi-2800', label: '안산·광주·파주·이천·평택' },
      { id: 'siheung-banwol', label: '시흥 반월특수지역' },
      { id: 'siheung-other', label: '그 밖의 시흥' },
      {
        id: 'namyangju-listed',
        label: '남양주 호평·평내·금곡·일패·이패·삼패·가운·수석·지금·도농동',
      },
      { id: 'namyangju-other', label: '그 밖의 남양주' },
      { id: 'gyeonggi-other', label: '그 밖의 경기 시·군' },
    ],
  },
  { id: 'sejong', label: '세종', metro: false, zone: 'sejong' },
  {
    id: 'metroCity',
    label: '광주·대구·대전·부산·울산',
    metro: false,
    zones: [
      { id: 'metro-city', label: '구 지역' },
      { id: 'metro-city-county', label: '군 지역' },
    ],
  },
  { id: 'other', label: '그 밖의 지역(도)', metro: false, zone: 'other' },
];

export const ALL_ZONE_IDS: ZoneId[] = SIDOS.flatMap((s) =>
  s.zone ? [s.zone] : (s.zones ?? []).map((z) => z.id),
);

export function sidoOf(id: SidoId): Sido | undefined {
  return SIDOS.find((s) => s.id === id);
}

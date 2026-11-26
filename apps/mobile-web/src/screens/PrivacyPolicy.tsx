import type { ReactNode } from 'react';
import { ANSWERS_KEY } from './wizard/answersStore';

/**
 * 개인정보 처리방침 (D-26 ⑧). 집각은 입력값을 서버로 보내지 않으므로(D-22) "수집하지 않음"이 핵심입니다.
 * 문구를 바꾸면 시행일(EFFECTIVE_DATE)도 함께 바꿉니다.
 */
export const EFFECTIVE_DATE = '2026년 11월 26일';

/** 공개 전에 사용자가 정할 문의처. 정해지기 전까지는 문의처 절을 보이지 않습니다(docs/STATUS.md 사용자 할 일). */
const CONTACT: string | null = null;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-lg leading-7 font-bold">{title}</h2>
      <div className="space-y-2 text-[15px] leading-7 text-ink">{children}</div>
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-16">
      <a className="text-sm font-medium text-pine underline underline-offset-2" href="#/">
        ← 집각으로 돌아가기
      </a>
      <h1 className="mt-6 mb-2 font-serif text-[28px] leading-[1.35] font-bold tracking-tight">
        개인정보 처리방침
      </h1>
      <p className="mb-8 text-sm text-ink-soft">시행일 {EFFECTIVE_DATE}</p>

      <div className="space-y-8">
        <Section title="수집하는 개인정보">
          <p>
            집각은 개인정보를 수집하지 않아요. 회원가입이 없고, 입력한 소득·자산·결혼 정보는 서버나
            다른 곳으로 보내지 않아요. 자격 판정은 지금 쓰는 기기 안에서만 계산해요.
          </p>
          <p>방문 통계나 광고를 위한 분석 도구(쿠키 포함)도 쓰지 않아요.</p>
        </Section>

        <Section title="기기에 저장하는 정보">
          <p>
            다음에 이어서 할 수 있도록, 입력한 답을 이 브라우저의 저장소(localStorage, 이름&nbsp;
            <code className="text-sm">{ANSWERS_KEY}</code>)에만 저장해요. 이 정보는 기기 밖으로
            나가지 않고, 집각도 볼 수 없어요.
          </p>
          <p>지우는 방법은 두 가지예요.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>첫 화면의 &lsquo;입력 지우기&rsquo;를 누르기</li>
            <li>브라우저 설정에서 이 사이트의 데이터(쿠키 및 사이트 데이터) 삭제하기</li>
          </ul>
          <p>공용 기기에서 썼다면 다 쓴 뒤 지워 주세요.</p>
        </Section>

        <Section title="접속 기록">
          <p>
            집각은 정적 웹호스팅으로 제공돼요. 호스팅 업체가 서비스 운영과 보안을 위해 접속 기록(IP
            주소, 브라우저 정보 등)을 처리할 수 있지만, 집각은 이 기록을 따로 수집하거나 분석하지
            않아요. 입력한 답은 이 기록에도 들어가지 않아요.
          </p>
        </Section>

        <Section title="외부 링크">
          <p>
            결과 화면의 링크는 주택도시기금 포털·기금e든든 같은 공식 사이트로 연결돼요. 그
            사이트에서 처리하는 개인정보는 해당 기관의 처리방침을 따라요. 집각은 링크를 열 때
            입력값을 함께 넘기지 않아요.
          </p>
        </Section>

        <Section title="제3자 제공·처리 위탁">
          <p>수집하는 개인정보가 없어서 제3자에게 제공하거나 처리를 맡기지 않아요.</p>
        </Section>

        {CONTACT && (
          <Section title="문의">
            <p>{CONTACT}</p>
          </Section>
        )}

        <Section title="방침이 바뀔 때">
          <p>이 방침이 바뀌면 이 페이지에 시행일과 함께 알려 드려요.</p>
        </Section>
      </div>
    </div>
  );
}

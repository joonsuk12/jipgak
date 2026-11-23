import { useId, useState } from 'react';
import { glossary, type TermKey } from '../glossary';

/** `**굵게**`만 지원하는 간단한 문단 렌더링 (용어집 상세용) */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * 한 줄 안내 + "자세히" (D-16). term을 주면 용어집에서 안내와 상세를 가져오고,
 * hint를 주면 안내 문장만 바꿉니다(상세는 용어집 그대로).
 */
export function Help({ term, hint, id }: { term?: TermKey; hint?: string; id?: string }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const entry = term ? glossary(term) : undefined;
  const text = hint ?? entry?.hint;
  if (!text) return null;
  return (
    <div className="border-l-2 border-rule pl-3 text-sm leading-6 text-ink-soft">
      <p id={id}>
        {text}
        {entry && entry.detail.length > 0 && (
          <>
            {' '}
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailId}
              className="inline font-medium text-pine underline underline-offset-2"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? '접기' : '자세히'}
            </button>
          </>
        )}
      </p>
      {entry && open && (
        <div id={detailId} className="mt-2 space-y-2 border-l-2 border-pine pl-3 text-ink">
          {entry.detail.map((d) => (
            <p key={d}>
              <Rich text={d} />
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

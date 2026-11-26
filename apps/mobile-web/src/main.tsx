import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// 글꼴은 앱에 포함해 외부(Google Fonts)로 요청하지 않습니다(D-26 ⑧). 한글은 글자 범위별로 나뉘어 필요한 묶음만 받습니다.
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root 요소가 없습니다');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

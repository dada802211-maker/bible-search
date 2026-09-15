import React from 'react';

// 本文はHTMLとして解釈せず、Reactのテキストとして安全に表示します。
export default function VerseList({ result }) {
  if (!result) return <div className="empty">聖書名と章を選ぶと、ここに本文が表示されます。</div>;
  return <article className="reading">
    <div className="reading-heading">
      <div><span className="eyebrow">聖書本文</span><h2>{result.book.name} <span>{result.chapter}章</span></h2></div>
      <span className="badge">{result.verses.length} 節を表示</span>
    </div>
    <ol className="verses">
      {result.verses.map((item) => <li key={item.verse}>
        <span className="verse-number" aria-label={`${item.verse}節`}>{item.verse}</span>
        <p>{item.text}</p>
      </li>)}
    </ol>
  </article>;
}

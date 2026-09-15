import React, { useEffect, useRef, useState } from 'react';
import { getBible } from './api.js';
import VerseList from './components/VerseList.jsx';

export default function App() {
  const [books, setBooks] = useState([]);
  const [no, setNo] = useState('1001');
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  // 終了節は任意。空欄なら従来どおり1節（開始も空欄なら章全体）を表示します。
  const [verseEnd, setVerseEnd] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(null);
  const chapterInput = useRef(null);
  const focusChapter = useRef(false);

  // データ取得後、章の選択欄が有効になってからフォーカスを移します。
  useEffect(() => {
    if (!busy && book && focusChapter.current) {
      focusChapter.current = false;
      chapterInput.current?.focus();
    }
  }, [busy, book]);

  useEffect(() => {
    const controller = new AbortController();
    getBible({ action: 'books' }, controller.signal).then(data => setBooks(data.books))
      .catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => { controller.abort(); request.current?.abort(); };
  }, []);

  // 先の検索を中断し、古い応答が最新の表示を上書きすることを防ぎます。
  async function run(operation) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError(''); setResult(null);
    try { await operation(controller.signal); }
    catch (error) { if (error.name !== 'AbortError') setError(error.message); }
    finally { if (request.current === controller) setBusy(false); }
  }

  function selectBook(event) {
    event.preventDefault();
    loadBook(no);
  }

  function loadBook(bookNo) {
    focusChapter.current = false;
    setBook(null); setChapters([]); setChapter(''); setVerse(''); setVerseEnd('');
    run(async signal => {
      const data = await getBible({ action: 'book', no: bookNo }, signal);
      if (signal.aborted) return;
      focusChapter.current = true;
      setBook(data.book); setChapters(data.chapters);
      setChapter(String(data.chapters[0]?.chapter ?? ''));
    });
  }

  function changeBookNo(event) {
    const value = event.target.value;
    setNo(value);
    // 入力途中に古い検索結果が反映されることを防ぎます。
    request.current?.abort();
    request.current = null;
    focusChapter.current = false;
    setBusy(false); setBook(null); setChapters([]); setChapter('');
    setVerse(''); setVerseEnd(''); setResult(null); setError('');
    if (/^[1-9][0-9]{3}$/.test(value)) loadBook(value);
  }

  function showVerses(event) {
    event.preventDefault();
    run(async signal => setResult(await getBible({
      action: 'verses', no: book.no, chapter, ...(verse ? { verse } : {}),
      ...(verse && verseEnd ? { verseEnd } : {}),
    }, signal)));
  }

  const selectedChapter = chapters.find(item => String(item.chapter) === chapter);
  return <>
    <header className="topbar"><span className="brand-mark" aria-hidden="true">✦</span> 聖書を読む <span className="header-note">日々のことばに、静かな時間を。</span></header>
    <main>
      <section className="intro"><span className="eyebrow">BIBLE READER</span><h1>ことばをひらく。</h1><p>聖書名を番号で選び、読みたい章・節へ。</p></section>
      <div className="layout">
        <aside className="panel">
          <h2><span className="step">01</span> 聖書名を選ぶ</h2>
          <form onSubmit={selectBook}>
            <label htmlFor="book-no">聖書番号（no）</label>
            <div className="input-row"><input id="book-no" inputMode="numeric" pattern="[1-9][0-9]{3}" maxLength={4} required list="book-options" value={no} onChange={changeBookNo} /><button disabled={busy}>選択</button></div>
            <datalist id="book-options">{books.map(item => <option key={item.no} value={item.no}>{item.name}</option>)}</datalist>
            <p className="hint">4桁入力で章へ移動します。章を選んだらTabで開始の節へ。<br />例：1001 創世記 ／ 2001 マタイによる福音書</p>
          </form>
          <div className="selected-book"><span>選択中の聖書名（name）</span><strong>{book ? book.name : '未選択'}</strong>{book && <small>no. {book.no} ・ 全{book.chapterCount}章</small>}</div>
          <h2><span className="step">02</span> 章・節を選ぶ</h2>
          <form onSubmit={showVerses}>
            <div className="selectors"><div><label htmlFor="chapter">章</label><select id="chapter" ref={chapterInput} disabled={!book || busy} required value={chapter} onChange={e => { setChapter(e.target.value); setVerse(''); setVerseEnd(''); setResult(null); setError(''); }}><option value="" disabled>章を選択</option>{chapters.map(item => <option key={item.chapter} value={item.chapter}>{item.chapter}章</option>)}</select></div>
            <div><label htmlFor="verse">開始の節</label><select id="verse" disabled={!chapter || busy} value={verse} onChange={e => { setVerse(e.target.value); setVerseEnd(''); setResult(null); setError(''); }}><option value="">すべての節</option>{Array.from({ length: Number(selectedChapter?.verseCount || 0) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}節から</option>)}</select></div></div>
            <div style={{ marginTop: 16 }}><label htmlFor="verse-end">終了の節（任意）</label><select id="verse-end" disabled={!verse || busy} value={verseEnd} onChange={e => { setVerseEnd(e.target.value); setResult(null); setError(''); }}>
              <option value="">指定しない</option>
              {verse && Array.from({ length: Math.max(0, Number(selectedChapter?.verseCount || 0) - Number(verse) + 1) }, (_, i) => { const number = Number(verse) + i; return <option key={number} value={number}>{number}節まで</option>; })}
            </select><p className="hint">終了を指定しない場合は開始の1節だけ表示します。「すべての節」では章全体を表示します。</p></div>
            <button className="full" disabled={!chapter || busy}>本文を表示 <span aria-hidden="true">→</span></button>
          </form>
          <details><summary>聖書番号の一覧</summary><ul className="book-index">{books.map(item => <li key={item.no}><span>{item.no}</span> {item.name}</li>)}</ul></details>
        </aside>
        <section className="content" aria-live="polite" aria-busy={busy}>
          {error ? <div className="error" role="alert">{error}</div> : busy ? <div className="empty">読み込み中…</div> : <VerseList result={result} />}
        </section>
      </div>
      <footer>聖書を読む <span>一節ずつ、ゆっくりと。</span></footer>
    </main>
  </>;
}

// 通信処理をまとめ、APIのエラー文を画面へ渡します。
export async function getBible(params, signal) {
  const response = await fetch(`/api.php?${new URLSearchParams(params)}`, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'データを取得できませんでした。');
  return data;
}

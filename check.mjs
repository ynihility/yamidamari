#!/usr/bin/env node
// check.mjs — 単一HTMLの <script> 構文チェッカ (依存なし / Node標準のみ)
//
// 使い方:   node check.mjs path/to/file.html
// 返り値:   構文エラーがあれば該当箇所を表示して exit 1 (FAIL)
//           インラインJSが全て構文OKなら exit 0 (PASS)
//           判定できない場合(対象JSなし/読込失敗)は exit 1 or 2
//
// 用途: HTMLを編集したあとに実行する → node check.mjs index.html
// 限界: 「構文が壊れてないか」だけを見る。ゲームがちゃんと動くか/面白いかは判定しない(それは目視)。
//       HTMLはregexで抽出するため、文字列中に </script> を含むような極端なコードには弱い。

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('使い方: node check.mjs <htmlファイル>');
  process.exit(2);
}

let html;
try {
  html = readFileSync(file, 'utf8');
} catch (e) {
  console.error(`読み込めない: ${file} (${e.message})`);
  process.exit(2);
}

// JSとしてチェックすべき type だけ通す(null=type属性なし=classic)
const jsTypes = new Set([null, '', 'text/javascript', 'application/javascript', 'module', 'text/babel']);

function attr(attrs, name) {
  const m = attrs.match(new RegExp(name + '\\s*=\\s*["\\\']([^"\\\']*)["\\\']', 'i'));
  return m ? m[1] : null;
}

const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const tmp = mkdtempSync(join(tmpdir(), 'htmlcheck-'));

let idx = 0, checked = 0, failures = 0;
let m;
while ((m = scriptRe.exec(html)) !== null) {
  idx++;
  const attrs = m[1] || '';
  const code  = m[2] || '';
  const type  = (attr(attrs, 'type') || '').toLowerCase() || null;
  const src   = attr(attrs, 'src');

  if (src) continue;                 // 外部読み込みは中身が無い
  if (!jsTypes.has(type)) continue;  // importmap / json / template等はスキップ
  if (!code.trim()) continue;        // 空

  checked++;
  const isModule = (type === 'module');

  // codeの1行目がHTMLの何行目か(エラー行マッピング用)
  const startLine = html.slice(0, m.index + m[0].indexOf(code)).split('\n').length;

  const tmpFile = join(tmp, `s${idx}.${isModule ? 'mjs' : 'js'}`);
  writeFileSync(tmpFile, code, 'utf8');

  try {
    execFileSync(process.execPath, ['--check', tmpFile], { stdio: 'pipe' });
  } catch (err) {
    failures++;
    const stderr = (err.stderr ? err.stderr.toString() : '') || err.message;
    const lm = stderr.match(/\.(?:mjs|js):(\d+)/);
    const tmpLine = lm ? parseInt(lm[1], 10) : null;
    const htmlLine = tmpLine ? startLine + tmpLine - 1 : null;

    console.error(`\n[FAIL] script #${idx}${isModule ? ' (module)' : ''} — HTML ~${startLine}行目から`);
    if (htmlLine) console.error(`  → 推定エラー箇所: ${file}:${htmlLine} 付近`);
    console.error(stderr.split('\n').filter(Boolean).slice(0, 6).map(l => '   ' + l).join('\n'));
  }
}

rmSync(tmp, { recursive: true, force: true });

if (checked === 0) {
  console.error('チェック対象のインラインJSが見つからなかった。verifierとして緑にはしない。');
  process.exit(1);
}
if (failures > 0) {
  console.error(`\n結果: インラインJS ${checked}件中 ${failures}件に構文エラー — FAIL`);
  process.exit(1);
}
console.log(`結果: インラインJS ${checked}件すべて構文OK — PASS`);
process.exit(0);

const fs = require('fs');
const zlib = require('zlib');

const W = 512, H = 512, S = 16; // 32x32 art pixels, each 16x16 real pixels
const buf = Buffer.alloc(W * H * 4, 0); // RGBA、透明で初期化

function px(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i]=r; buf[i+1]=g; buf[i+2]=b; buf[i+3]=a;
}

// アートピクセル1つ（SxSブロック）を塗る
function dot(ax, ay, c, a=255) {
  if (!c) return;
  for (let dy=0; dy<S; dy++)
    for (let dx=0; dx<S; dx++)
      px(ax*S+dx, ay*S+dy, c[0], c[1], c[2], a);
}

// アートピクセル単位の矩形塗り
function rect(ax, ay, aw, ah, c, a=255) {
  for (let y=ay; y<ay+ah; y++)
    for (let x=ax; x<ax+aw; x++)
      dot(x, y, c, a);
}

// カラーパレット
const O  = [80,30,100];       // アウトライン（ダークパープル）
const P  = [255,182,200];     // ボディ（ライトピンク）
const q  = [230,140,175];     // やや濃いピンク（耳の内側・影）
const W2 = [255,255,255];     // 白（目の白目）
const B  = [60,40,80];        // 黒紫（瞳）
const R  = [255,130,155];     // ブラッシュ（頬）
const A  = [180,90,220];      // アンテナ（パープル）
const G  = [255,215,80];      // ジェム（ゴールド）
const Gc = [255,245,200];     // ジェム中心（明るい黄白）
const Hi = [255,240,248];     // ハイライト（ほぼ白のピンク）
const mo = [210,90,130];      // 口の中（ダークピンク）
const ct = [255,200,220];     // 回路ドット（薄いピンク）

// ─── アンテナのジェム（上部中央、col 15） ───────────────────────
dot(15,1,G);
dot(14,2,G); dot(15,2,Gc); dot(16,2,G);
dot(15,3,G);

// ─── アンテナの軸 ────────────────────────────────────────────────
dot(15,4,A);
dot(15,5,A); // ボディ上端に接続

// ─── 猫耳（ボディ上角に小さく） ─────────────────────────────────
// 左耳（col 4-6, row 3-4）
dot(4,4,O); dot(5,4,O); dot(6,4,O);
dot(4,3,O); dot(5,3,q); dot(6,3,O);
dot(5,2,O); // 先端

// 右耳（col 25-27, row 3-4）
dot(25,4,O); dot(26,4,O); dot(27,4,O);
dot(25,3,O); dot(26,3,q); dot(27,3,O);
dot(26,2,O); // 先端

// ─── ボディアウトライン（24x22 art pixels） ──────────────────────
const BX=4, BY=5, BW=24, BH=22;
for (let x=BX; x<BX+BW; x++) { dot(x,BY,O); dot(x,BY+BH-1,O); }
for (let y=BY; y<BY+BH; y++) { dot(BX,y,O); dot(BX+BW-1,y,O); }

// ─── ボディ塗り（ライトピンク） ───────────────────────────────────
rect(BX+1, BY+1, BW-2, BH-2, P);

// ─── 上部ハイライト（2行分） ─────────────────────────────────────
for (let x=BX+1; x<BX+BW-1; x++) dot(x, BY+1, Hi);
for (let x=BX+2; x<BX+BW-2; x++) dot(x, BY+2, Hi);

// ─── 目（5x5アートピクセル） ─────────────────────────────────────
const EY=8;
const LEX=9;  // 左目：col 9-13、中心 col 11
const REX=19; // 右目：col 19-23、中心 col 21

// 左目
rect(LEX, EY, 5, 5, O);           // アウトライン
rect(LEX+1, EY+1, 3, 3, W2);      // 白目
dot(LEX+3, EY+3, B);               // 瞳
dot(LEX+1, EY+1, Hi);              // ハイライト

// 右目
rect(REX, EY, 5, 5, O);
rect(REX+1, EY+1, 3, 3, W2);
dot(REX+3, EY+3, B);
dot(REX+1, EY+1, Hi);

// ─── 頬ブラッシュ（目の下、半透明） ─────────────────────────────
rect(8, 14, 4, 2, R, 170);
rect(19, 14, 4, 2, R, 170);

// ─── 口（カーブスマイル） ────────────────────────────────────────
dot(12,17,O); dot(20,17,O);         // 口の角
dot(11,18,O);                        // 左カーブ
for (let x=12; x<=20; x++) dot(x,18,mo); // 口の中（濃いピンク）
dot(21,18,O);                        // 右カーブ
for (let x=12; x<=20; x++) dot(x,19,O); // 口の下縁

// ─── AIっぽい回路ドット装飾（ボディ下部） ───────────────────────
for (let x=8; x<=12; x+=2) dot(x,22,ct);
for (let x=19; x<=23; x+=2) dot(x,22,ct);
dot(15,22,ct); dot(16,22,ct); // 中央

// ─── PNG エンコード ───────────────────────────────────────────────

// CRC32計算
function crc32(data) {
  const t = new Uint32Array(256);
  for (let i=0; i<256; i++) {
    let c=i;
    for (let j=0; j<8; j++) c = (c&1) ? 0xEDB88320^(c>>>1) : c>>>1;
    t[i]=c;
  }
  let c=0xFFFFFFFF;
  for (const b of data) c = t[(c^b)&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}

// PNGチャンク生成
function chunk(type, data) {
  const lb=Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const td=Buffer.concat([Buffer.from(type,'ascii'), data]);
  const cb=Buffer.alloc(4); cb.writeUInt32BE(crc32(td));
  return Buffer.concat([lb, td, cb]);
}

// PNGシグネチャ
const sig = Buffer.from([137,80,78,71,13,10,26,10]);

// IHDR（画像ヘッダ）
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4);
ihdr[8]=8; ihdr[9]=6; // ビット深度8、カラータイプ6=RGBA

// 生スキャンラインデータ（各行の先頭にフィルタバイト0を付与）
const raw = Buffer.alloc(H*(1+W*4));
for (let y=0; y<H; y++) {
  raw[y*(1+W*4)]=0; // フィルタ: None
  for (let x=0; x<W; x++) {
    const s=(y*W+x)*4, d=y*(1+W*4)+1+x*4;
    raw[d]=buf[s]; raw[d+1]=buf[s+1]; raw[d+2]=buf[s+2]; raw[d+3]=buf[s+3];
  }
}

// zlibで圧縮してIDATチャンクに
const comp = zlib.deflateSync(raw, {level:9});
const png = Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',comp), chunk('IEND',Buffer.alloc(0))]);
fs.writeFileSync('icon.png', png);
console.log('icon.png 生成完了:', W+'x'+H, 'px /', png.length, 'bytes');

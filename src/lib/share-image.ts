// Draws the Skin Match result as a 1080x1350 PNG for Instagram / LINE / WeChat.
export async function makeShareImage(d: {
  title: string; subtitle: string; footer: string;
  steps: { step: string; brand: string; name: string }[];
}): Promise<Blob> {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  try { await document.fonts.ready; } catch { /* ignore */ }
  const font = (w: number, px: number) => `${w} ${px}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#FCE8EF"); bg.addColorStop(1, "#F7D3E0");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  g.fillStyle = "#1A1A1A"; g.font = font(800, 56); g.fillText("Hi", 80, 130);
  const hi = g.measureText("Hi").width;
  g.fillStyle = "#C2255C"; g.fillText("Seoul", 80 + hi, 130);

  g.fillStyle = "#1A1A1A"; g.font = font(800, 72);
  wrap(g, d.title, 80, 260, W - 160, 88);
  g.fillStyle = "#8A1C45"; g.font = font(600, 38); g.fillText(d.subtitle, 80, 340);

  let y = 420;
  const cardH = 170;
  for (const s of d.steps) {
    g.fillStyle = "#FFFFFF"; roundRect(g, 80, y, W - 160, cardH, 32); g.fill();
    g.fillStyle = "#C2255C"; g.font = font(700, 30); g.fillText(s.step, 120, y + 52);
    g.fillStyle = "#5B6068"; g.font = font(500, 30); g.fillText(clip(g, s.brand, W - 240), 120, y + 98);
    g.fillStyle = "#1A1A1A"; g.font = font(700, 38); g.fillText(clip(g, s.name, W - 240), 120, y + 145);
    y += cardH + 28;
  }
  g.fillStyle = "#8A1C45"; g.font = font(600, 32); g.fillText(d.footer, 80, H - 80);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function clip(g: CanvasRenderingContext2D, s: string, max: number) {
  if (g.measureText(s).width <= max) return s;
  while (s.length && g.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}
function wrap(g: CanvasRenderingContext2D, s: string, x: number, y: number, max: number, lh: number) {
  if (g.measureText(s).width <= max) { g.fillText(s, x, y); return; }
  const cut = Math.ceil(s.length / 2);
  g.fillText(s.slice(0, cut), x, y - lh / 2); g.fillText(s.slice(cut), x, y + lh / 2);
}

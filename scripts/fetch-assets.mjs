import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const assets = [
  ["public/og.jpg", "https://raw.githubusercontent.com/rokit-beep/text-bssed-game-pro/main/public/og.jpg"],
  ["public/icon-192.png", "https://rokit-beep.github.io/icon-192.png"],
  ["public/icon-512.png", "https://rokit-beep.github.io/icon-512.png"],
  ["public/apple-touch-icon.png", "https://rokit-beep.github.io/apple-touch-icon.png"],
];

for (const [path, url] of assets) {
  try {
    await access(path);
    continue;
  } catch {
    // missing locally — fetch from the live PWA / old asset repo
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`skip ${path}: ${url} → ${res.status}`);
    continue;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
  console.log("fetched", path);
}

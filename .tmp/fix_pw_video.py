from pathlib import Path
p = Path("apps/mindmark-web/playwright.config.ts")
t = p.read_text(encoding="utf-8-sig")
t = t.replace("    video: 'retain-on-failure',", "    video: 'off',")
p.write_text(t, encoding="utf-8")
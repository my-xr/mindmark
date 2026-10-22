from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/GradingView.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("""const formatDuration = (durationMs: number) =>
  durationMs >= 1000 ? ${(durationMs / 1000).toFixed(1)}s : ${durationMs}ms;
""", """const formatDuration = (durationMs: number) =>
  durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`;
""")
p.write_text(s, encoding='utf-8', newline='\n')

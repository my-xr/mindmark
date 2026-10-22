from pathlib import Path
p=Path('apps/mindmark-server/src/main/resources/application.yml')
s=p.read_text(encoding='utf-8')
s=s.replace('access-key: ${MINDMARK_MINIO_ACCESS_KEY:}', 'access-key: ${MINDMARK_MINIO_ACCESS_KEY:minioadmin}')
s=s.replace('secret-key: ${MINDMARK_MINIO_SECRET_KEY:}', 'secret-key: ${MINDMARK_MINIO_SECRET_KEY:minioadmin123}')
p.write_text(s, encoding='utf-8')

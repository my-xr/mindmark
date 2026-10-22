const fs = require('fs');
{
  const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/dto/PaperResponse.java';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(`    String title,
    String courseName,
`, `    String title,
    String courseId,
    String courseName,
`);
  fs.writeFileSync(p, s);
}
{
  const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperResponseMapper.java';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(`            entity.getTitle(),
            entity.getCourseName(),
`, `            entity.getTitle(),
            entity.getCourseId(),
            entity.getCourseName(),
`);
  fs.writeFileSync(p, s);
}

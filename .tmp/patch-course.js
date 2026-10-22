const fs = require('fs');
{
  const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/domain/PaperEntity.java';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(`    @Column(name = "course_name", nullable = false, length = 128)
    private String courseName;
`, `    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "course_name", nullable = false, length = 128)
    private String courseName;
`);
  s = s.replace(`    public String getCourseName() {
        return courseName;
    }
`, `    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getCourseName() {
        return courseName;
    }
`);
  fs.writeFileSync(p, s);
}
{
  const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/QuestionEntity.java';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace('@Column(name = "course_id", length = 64)', '@Column(name = "course_id", nullable = false, length = 64)');
  s = s.replace('@Column(name = "course_name", length = 128)', '@Column(name = "course_name", nullable = false, length = 128)');
  fs.writeFileSync(p, s);
}

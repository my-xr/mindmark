import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.OffsetDateTime;
import java.util.*;

public class CleanupMindmarkSeedData {
  static final String URL = "jdbc:postgresql://localhost:5432/mindmark";
  static final String USER = "postgres";
  static final String PASS = "123456";
  static final String TEACHER_HASH = "pbkdf2:120000:E5YGr6c97DQN0Nt39iPn+g==:1Xwe8ZbNlBBHZd1vd4fBkNMoV7Q5rOOjU7tl5jgK3H0=";
  static final String STUDENT_HASH = "pbkdf2:120000:O1ffMzeasXp6DaATIjmOvQ==:e3qjyQGqNcWd+g+nq/5ZhNEMXrBtIOQmn2jAB0W9t3c="; // Mindmark123
  static final String[] TYPES = {"SINGLE_CHOICE","MULTIPLE_CHOICE","TRUE_FALSE","FILL_BLANK","SHORT_ANSWER","PROGRAMMING"};

  record CourseSeed(String id, String code, String name, String clsId, String clsCode, String clsName, String paperId, String paperTitle, String prefix) {}

  static final CourseSeed[] COURSES = new CourseSeed[]{
    new CourseSeed("course-frontend-001", "MM-FE", "前端工程实践", "class-frontend-001", "FE-2026-01", "前端工程实践 1 班", "paper-fe-100", "前端工程实践 100 分综合试卷", "FE"),
    new CourseSeed("course-backend-001", "MM-BE", "后端工程实践", "class-backend-001", "BE-2026-01", "后端工程实践 1 班", "paper-be-100", "?????? 100 ?????", "BE"),
    new CourseSeed("course-ai-001", "MM-AI", "AI 与软件工程", "class-ai-001", "AI-2026-01", "AI 与软件工程 1 班", "paper-ai-100", "AI 与软件工程 100 分综合试卷", "AI")
  };

  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection c = DriverManager.getConnection(URL, USER, PASS)) {
      c.setAutoCommit(false);
      backup(c);
      truncate(c);
      seedRoles(c);
      seedUsers(c);
      seedCoursesClasses(c);
      seedQuestionsAndPapers(c);
      c.commit();
    } catch (Exception e) {
      e.printStackTrace();
      throw e;
    }
    inspect();
  }

  static void backup(Connection c) throws Exception {
    String file = ".tmp/mindmark-db-backup-before-cleanup-" + System.currentTimeMillis() + ".jsonl";
    try (PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
      List<String> tables = new ArrayList<>();
      try (PreparedStatement ps = c.prepareStatement("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name not in ('flyway_schema_history') order by table_name"); ResultSet rs = ps.executeQuery()) {
        while (rs.next()) tables.add(rs.getString(1));
      }
      for (String table : tables) {
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery("select * from \"" + table + "\"")) {
          ResultSetMetaData md = rs.getMetaData();
          while (rs.next()) {
            out.print("{\"table\":\""); out.print(esc(table)); out.print("\",\"row\":{");
            for (int i=1;i<=md.getColumnCount();i++) {
              if (i>1) out.print(',');
              out.print('"'); out.print(esc(md.getColumnName(i))); out.print("\":");
              Object v = rs.getObject(i);
              if (v == null) out.print("null");
              else if (v instanceof Number || v instanceof Boolean) out.print(v.toString());
              else { out.print('"'); out.print(esc(String.valueOf(v))); out.print('"'); }
            }
            out.println("}}");
          }
        }
      }
    }
    System.out.println("backup=" + file);
  }

  static String esc(String s) {
    return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r").replace("\n", "\\n");
  }

  static void truncate(Connection c) throws SQLException {
    String tables = String.join(", ", Arrays.asList(
      "ai_lecture_draft_task", "ai_provider_setting", "ai_question_generation_task",
      "answer_item", "answer_sheet", "api_contract_snapshot", "audit_operation_log", "auth_audit_log",
      "auth_user_role", "auth_user", "course", "exam", "exam_class", "exam_participant", "exam_security_event",
      "grading_ai_job", "grading_item", "grading_task", "paper", "paper_question", "programming_judge_result",
      "programming_judge_submission", "programming_test_case", "question", "question_knowledge_point",
      "review_artifact", "review_lecture_draft", "roster_import_task", "score_report", "student_profile",
      "teacher_class_assignment", "teaching_class"
    ));
    try (Statement st = c.createStatement()) { st.execute("TRUNCATE TABLE " + tables + " CASCADE"); }
  }

  static void seedRoles(Connection c) throws SQLException {
    try (PreparedStatement ps = c.prepareStatement("insert into auth_role(code,name) values (?,?) on conflict(code) do update set name=excluded.name")) {
      role(ps,"ADMIN","系统管理员"); role(ps,"TEACHER","教师"); role(ps,"TA","助教"); role(ps,"STUDENT","学生");
    }
  }
  static void role(PreparedStatement ps, String code, String name) throws SQLException { ps.setString(1,code); ps.setString(2,name); ps.executeUpdate(); }

  static void seedUsers(Connection c) throws SQLException {
    try (PreparedStatement ps = c.prepareStatement("insert into auth_user(id,name,email,username,password_hash,must_change_password,password_updated_at,account_source,status,student_id,created_at,updated_at,failed_login_count) values (?,?,?,?,?,?,now(),?,?,?,now(),now(),0)")) {
      ps.setString(1,"u-teacher-001"); ps.setString(2,"MindMark 教师"); ps.setString(3,"teacher@mindmark.local"); ps.setString(4,"teacher@mindmark.local"); ps.setString(5,TEACHER_HASH); ps.setBoolean(6,false); ps.setString(7,"SYSTEM_SEED"); ps.setString(8,"ACTIVE"); ps.setNull(9,Types.VARCHAR); ps.executeUpdate();
      for (int i=1;i<=10;i++) {
        String no = (i==1) ? "20260722120655" : String.format("202607221200%02d", i);
        String sid = String.format("student-clean-%03d", i);
        ps.setString(1,String.format("u-student-clean-%03d", i));
        ps.setString(2,String.format("验收学生%02d", i));
        ps.setString(3,no+"@student.mindmark.local");
        ps.setString(4,no);
        ps.setString(5,STUDENT_HASH);
        ps.setBoolean(6,false);
        ps.setString(7,"CLEAN_SEED");
        ps.setString(8,"ACTIVE");
        ps.setString(9,sid);
        ps.executeUpdate();
      }
    }
    try (PreparedStatement ps = c.prepareStatement("insert into auth_user_role(user_id,role_code) values (?,?)")) {
      addUserRole(ps,"u-teacher-001","ADMIN"); addUserRole(ps,"u-teacher-001","TEACHER"); addUserRole(ps,"u-teacher-001","TA");
      for (int i=1;i<=10;i++) addUserRole(ps,String.format("u-student-clean-%03d", i),"STUDENT");
    }
  }
  static void addUserRole(PreparedStatement ps, String uid, String role) throws SQLException { ps.setString(1,uid); ps.setString(2,role); ps.executeUpdate(); }

  static void seedCoursesClasses(Connection c) throws SQLException {
    try (PreparedStatement cp = c.prepareStatement("insert into course(id,code,name,description,status,created_at,updated_at) values (?,?,?,?, 'ACTIVE', now(), now())");
         PreparedStatement clp = c.prepareStatement("insert into teaching_class(id,course_id,code,name,grade,major,status,created_at,updated_at) values (?,?,?,?,?,?, 'ACTIVE', now(), now())");
         PreparedStatement ap = c.prepareStatement("insert into teacher_class_assignment(id,user_id,class_id,assignment_role,created_at) values (?,?,?,?,now())")) {
      for (CourseSeed cs: COURSES) {
        cp.setString(1,cs.id); cp.setString(2,cs.code); cp.setString(3,cs.name); cp.setString(4,cs.name + "课程，作为清理后的稳定验收数据。"); cp.executeUpdate();
        clp.setString(1,cs.clsId); clp.setString(2,cs.id); clp.setString(3,cs.clsCode); clp.setString(4,cs.clsName); clp.setString(5,"2026"); clp.setString(6,"软件工程"); clp.executeUpdate();
        ap.setString(1,"assign-"+cs.prefix.toLowerCase()); ap.setString(2,"u-teacher-001"); ap.setString(3,cs.clsId); ap.setString(4,"OWNER"); ap.executeUpdate();
      }
    }
    try (PreparedStatement sp = c.prepareStatement("insert into student_profile(id,user_id,student_no,class_id,class_name,grade,major,created_at,updated_at) values (?,?,?,?,?,?,?,now(),now())")) {
      for (int i=1;i<=10;i++) {
        CourseSeed cs = i <= 4 ? COURSES[0] : (i <= 7 ? COURSES[1] : COURSES[2]);
        String no = (i==1) ? "20260722120655" : String.format("202607221200%02d", i);
        sp.setString(1,String.format("student-clean-%03d", i));
        sp.setString(2,String.format("u-student-clean-%03d", i));
        sp.setString(3,no); sp.setString(4,cs.clsId); sp.setString(5,cs.clsName); sp.setString(6,"2026"); sp.setString(7,"软件工程"); sp.executeUpdate();
      }
    }
  }

  static void seedQuestionsAndPapers(Connection c) throws SQLException {
    try (PreparedStatement qp = c.prepareStatement("insert into question(id,title,type,difficulty,source,status,score,answer_json,analysis,options_json,scoring_points_json,created_by,updated_at,course_id,course_name) values (?,?,?,?, 'MANUAL','ACTIVE',?,?,?,?,?,'MindMark 教师',now(),?,?)");
         PreparedStatement kp = c.prepareStatement("insert into question_knowledge_point(question_id,order_index,knowledge_point) values (?,?,?)");
         PreparedStatement pp = c.prepareStatement("insert into paper(id,title,course_name,description,duration_minutes,total_score,status,created_by,updated_at,course_id) values (?,?,?,?,90,100,'READY','MindMark 教师',now(),?)");
         PreparedStatement pqp = c.prepareStatement("insert into paper_question(id,paper_id,question_id,order_index,score) values (?,?,?,?,?)")) {
      int paperNo=0;
      for (CourseSeed cs: COURSES) {
        paperNo++;
        pp.setString(1,cs.paperId); pp.setString(2,cs.paperTitle); pp.setString(3,cs.name); pp.setString(4,"清理后保留的 100 分综合试卷，覆盖单选、多选、判断、填空、简答、编程题。"); pp.setString(5,cs.id); pp.executeUpdate();
        int order=1;
        order = createType(c, qp, kp, pqp, cs, "SINGLE_CHOICE", 10, new BigDecimal("1"), order);
        order = createType(c, qp, kp, pqp, cs, "MULTIPLE_CHOICE", 10, new BigDecimal("2"), order);
        order = createType(c, qp, kp, pqp, cs, "TRUE_FALSE", 10, new BigDecimal("1"), order);
        order = createType(c, qp, kp, pqp, cs, "FILL_BLANK", 10, new BigDecimal("1"), order);
        order = createType(c, qp, kp, pqp, cs, "SHORT_ANSWER", 4, new BigDecimal("5"), order);
        order = createType(c, qp, kp, pqp, cs, "PROGRAMMING", 3, new BigDecimal("10"), order);
      }
    }
  }

  static int createType(Connection c, PreparedStatement qp, PreparedStatement kp, PreparedStatement pqp, CourseSeed cs, String type, int count, BigDecimal score, int orderStart) throws SQLException {
    int order = orderStart;
    for (int i=1;i<=count;i++) {
      String qid = String.format("Q-%s-%s-%02d", cs.prefix, shortType(type), i);
      QuestionData q = data(cs.name, type, i);
      qp.setString(1,qid); qp.setString(2,q.title); qp.setString(3,type); qp.setString(4,difficulty(type,i)); qp.setBigDecimal(5,score); qp.setString(6,q.answerJson); qp.setString(7,q.analysis); qp.setString(8,q.optionsJson); qp.setString(9,q.scoringJson); qp.setString(10,cs.id); qp.setString(11,cs.name); qp.executeUpdate();
      kp.setString(1,qid); kp.setInt(2,0); kp.setString(3,q.knowledge); kp.executeUpdate();
      pqp.setString(1,String.format("PQ-%s-%03d", cs.prefix, order)); pqp.setString(2,cs.paperId); pqp.setString(3,qid); pqp.setInt(4,order); pqp.setBigDecimal(5,score); pqp.executeUpdate();
      order++;
    }
    return order;
  }

  static String shortType(String type) { return switch(type) { case "SINGLE_CHOICE" -> "SC"; case "MULTIPLE_CHOICE" -> "MC"; case "TRUE_FALSE" -> "TF"; case "FILL_BLANK" -> "FB"; case "SHORT_ANSWER" -> "SA"; default -> "PG"; }; }
  static String difficulty(String type, int i) { if (type.equals("PROGRAMMING")) return i==3?"VERY_HARD":"HARD"; if (type.equals("SHORT_ANSWER")) return i%2==0?"HARD":"MEDIUM"; String[] d={"VERY_EASY","EASY","MEDIUM","HARD","VERY_HARD"}; return d[(i-1)%d.length]; }
  record QuestionData(String title, String answerJson, String analysis, String optionsJson, String scoringJson, String knowledge) {}
  static QuestionData data(String course, String type, int i) {
    return switch(type) {
      case "SINGLE_CHOICE" -> new QuestionData(course+" 单选题 "+i+"：请选择最符合工程规范的一项。", "\"A\"", "答案 A 强调边界清晰、职责明确和可维护性。", "[{\"key\":\"A\",\"content\":\"职责清晰，边界明确\"},{\"key\":\"B\",\"content\":\"所有逻辑集中到一个文件\"},{\"key\":\"C\",\"content\":\"忽略异常处理\"},{\"key\":\"D\",\"content\":\"不保留审计记录\"}]", "[]", "工程规范");
      case "MULTIPLE_CHOICE" -> new QuestionData(course+" 多选题 "+i+"：稳定系统通常应具备哪些能力？", "[\"A\",\"C\"]", "稳定系统应具备权限边界、审计追踪和可恢复能力。", "[{\"key\":\"A\",\"content\":\"权限控制\"},{\"key\":\"B\",\"content\":\"共享账号\"},{\"key\":\"C\",\"content\":\"关键操作审计\"},{\"key\":\"D\",\"content\":\"只依赖前端校验\"}]", "[]", "系统稳定性");
      case "TRUE_FALSE" -> new QuestionData(course+" 判断题 "+i+"：关键业务操作应在后端进行权限校验。", "\"True\"", "关键业务不能只依赖前端控制，后端必须校验权限。", "[{\"key\":\"True\",\"content\":\"正确\"},{\"key\":\"False\",\"content\":\"错误\"}]", "[]", "权限校验");
      case "FILL_BLANK" -> new QuestionData(course+" 填空题 "+i+"：用于记录关键操作并支持追溯的能力称为____。", "\"审计\"", "审计日志用于安全追踪和责任定位。", "[]", "[{\"id\":\"SP-FB-1\",\"description\":\"写出审计\",\"score\":1,\"keywords\":[\"审计\"],\"required\":true}]", "审计追踪");
      case "SHORT_ANSWER" -> new QuestionData(course+" 简答题 "+i+"：请说明企业级系统为什么需要数据校验和错误处理。", "\"应说明输入校验、业务规则校验、异常提示、日志记录和可恢复性。\"", "答案应覆盖校验、防错、可观测和用户友好提示。", "[]", "[{\"id\":\"SP-SA-1\",\"description\":\"说明输入与业务校验\",\"score\":2,\"keywords\":[\"校验\",\"业务规则\"],\"required\":true},{\"id\":\"SP-SA-2\",\"description\":\"说明错误提示与日志\",\"score\":2,\"keywords\":[\"错误提示\",\"日志\"],\"required\":true},{\"id\":\"SP-SA-3\",\"description\":\"说明可恢复性\",\"score\":1,\"keywords\":[\"恢复\",\"重试\"],\"required\":false}]", "企业级质量");
      default -> new QuestionData(course+" 编程题 "+i+"：实现一个函数，统计数组中大于等于 60 的元素数量。", "\"遍历数组，判断元素是否大于等于 60，满足条件则计数加一并返回计数。\"", "评分关注遍历、条件判断、返回值和复杂度。", "[]", "[{\"id\":\"SP-PG-1\",\"description\":\"正确遍历数组\",\"score\":3,\"keywords\":[\"遍历\",\"数组\"],\"required\":true},{\"id\":\"SP-PG-2\",\"description\":\"判断大于等于 60\",\"score\":3,\"keywords\":[\"60\",\">=\"],\"required\":true},{\"id\":\"SP-PG-3\",\"description\":\"返回正确计数\",\"score\":3,\"keywords\":[\"计数\",\"return\"],\"required\":true},{\"id\":\"SP-PG-4\",\"description\":\"复杂度 O(n)\",\"score\":1,\"keywords\":[\"O(n)\"],\"required\":false}]", "编程实现");
    };
  }

  static void inspect() throws Exception {
    try(Connection c=DriverManager.getConnection(URL, USER, PASS); Statement st=c.createStatement()) {
      String[] q={"select count(*) from course", "select count(*) from paper", "select count(*) from auth_user where id='u-teacher-001'", "select count(*) from student_profile", "select count(*) from question", "select count(*) from exam"};
      for (String s:q) try(ResultSet rs=st.executeQuery(s)){rs.next(); System.out.println(s + " = " + rs.getLong(1));}
      try(ResultSet rs=st.executeQuery("select p.id,p.title,p.total_score,count(pq.question_id) from paper p join paper_question pq on pq.paper_id=p.id group by p.id,p.title,p.total_score order by p.id")) { while(rs.next()) System.out.println("paper="+rs.getString(1)+", score="+rs.getBigDecimal(3)+", questions="+rs.getLong(4)); }
    }
  }
}

import java.math.BigDecimal;
import java.sql.*;
import java.time.OffsetDateTime;
import java.util.*;

public class CleanMindmarkBaselineData {
  static final String URL = "jdbc:postgresql://localhost:5432/mindmark";
  static final String USER = "postgres";
  static final String PASS = "123456";
  static final String TEACHER_HASH = "pbkdf2:120000:E5YGr6c97DQN0Nt39iPn+g==:1Xwe8ZbNlBBHZd1vd4fBkNMoV7Q5rOOjU7tl5jgK3H0="; // dev-password
  static final String STUDENT_HASH = "pbkdf2:120000:O1ffMzeasXp6DaATIjmOvQ==:e3qjyQGqNcWd+g+nq/5ZhNEMXrBtIOQmn2jAB0W9t3c="; // Mindmark123
  static final OffsetDateTime NOW = OffsetDateTime.now();

  record CourseSeed(String id, String code, String name, String clsId, String clsCode, String clsName, String paperId, String paperTitle, String prefix) {}
  record QuestionData(String title, String answerJson, String analysis, String optionsJson, String scoringJson, String knowledge) {}

  static final CourseSeed[] COURSES = new CourseSeed[]{
    new CourseSeed("course-frontend-001", "MM-FE", "\u524d\u7aef\u5de5\u7a0b\u5b9e\u8df5", "class-frontend-001", "FE-2026-01", "\u524d\u7aef\u5de5\u7a0b\u5b9e\u8df5 1 \u73ed", "paper-fe-100", "\u524d\u7aef\u5de5\u7a0b\u5b9e\u8df5 100 \u5206\u7efc\u5408\u8bd5\u5377", "FE"),
    new CourseSeed("course-backend-001", "MM-BE", "\u540e\u7aef\u5de5\u7a0b\u5b9e\u8df5", "class-backend-001", "BE-2026-01", "\u540e\u7aef\u5de5\u7a0b\u5b9e\u8df5 1 \u73ed", "paper-be-100", "\u540e\u7aef\u5de5\u7a0b\u5b9e\u8df5 100 \u5206\u7efc\u5408\u8bd5\u5377", "BE"),
    new CourseSeed("course-ai-001", "MM-AI", "AI \u4e0e\u8f6f\u4ef6\u5de5\u7a0b", "class-ai-001", "AI-2026-01", "AI \u4e0e\u8f6f\u4ef6\u5de5\u7a0b 1 \u73ed", "paper-ai-100", "AI \u4e0e\u8f6f\u4ef6\u5de5\u7a0b 100 \u5206\u7efc\u5408\u8bd5\u5377", "AI")
  };

  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection c = DriverManager.getConnection(URL, USER, PASS)) {
      c.setAutoCommit(false);
      truncateRuntimeTables(c);
      seedRoles(c);
      seedUsers(c);
      seedCoursesAndClasses(c);
      seedQuestionsAndPapers(c);
      c.commit();
    }
    inspect();
  }

  static void truncateRuntimeTables(Connection c) throws SQLException {
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
      role(ps, "ADMIN", "\u7cfb\u7edf\u7ba1\u7406\u5458");
      role(ps, "TEACHER", "\u6559\u5e08");
      role(ps, "TA", "\u52a9\u6559");
      role(ps, "STUDENT", "\u5b66\u751f");
    }
  }
  static void role(PreparedStatement ps, String code, String name) throws SQLException { ps.setString(1, code); ps.setString(2, name); ps.executeUpdate(); }

  static void seedUsers(Connection c) throws SQLException {
    try (PreparedStatement ps = c.prepareStatement("insert into auth_user(id,name,email,status,student_id,created_at,updated_at,username,password_hash,must_change_password,password_updated_at,last_login_at,account_source,failed_login_count,locked_until) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")) {
      user(ps, "u-teacher-001", "MindMark \u6559\u5e08", "teacher@mindmark.local", "ACTIVE", null, "teacher@mindmark.local", TEACHER_HASH, false, "SYSTEM_SEED");
      for (int i = 1; i <= 10; i++) {
        String no = i == 1 ? "20260722120655" : String.format("202607221200%02d", i);
        user(ps, "u-student-" + String.format("%03d", i), "\u5b66\u751f" + String.format("%02d", i), no + "@student.mindmark.local", "ACTIVE", no, no, STUDENT_HASH, false, "ROSTER_IMPORT");
      }
    }
    try (PreparedStatement ps = c.prepareStatement("insert into auth_user_role(user_id,role_code) values (?,?)")) {
      userRole(ps, "u-teacher-001", "ADMIN"); userRole(ps, "u-teacher-001", "TEACHER"); userRole(ps, "u-teacher-001", "TA");
      for (int i = 1; i <= 10; i++) userRole(ps, "u-student-" + String.format("%03d", i), "STUDENT");
    }
  }
  static void user(PreparedStatement ps, String id, String name, String email, String status, String studentId, String username, String hash, boolean mustChange, String source) throws SQLException {
    int n=1; ps.setString(n++,id); ps.setString(n++,name); ps.setString(n++,email); ps.setString(n++,status); ps.setString(n++,studentId); ps.setObject(n++,NOW); ps.setObject(n++,NOW); ps.setString(n++,username); ps.setString(n++,hash); ps.setBoolean(n++,mustChange); ps.setObject(n++,NOW); ps.setObject(n++,null); ps.setString(n++,source); ps.setInt(n++,0); ps.setObject(n++,null); ps.executeUpdate();
  }
  static void userRole(PreparedStatement ps, String userId, String roleCode) throws SQLException { ps.setString(1,userId); ps.setString(2,roleCode); ps.executeUpdate(); }

  static void seedCoursesAndClasses(Connection c) throws SQLException {
    try (PreparedStatement ps = c.prepareStatement("insert into course(id,code,name,description,status,created_at,updated_at) values (?,?,?,?,?,?,?)")) {
      for (CourseSeed s : COURSES) {
        ps.setString(1,s.id); ps.setString(2,s.code); ps.setString(3,s.name); ps.setString(4,s.name + "\u8bfe\u7a0b\u57fa\u7ebf\u6570\u636e"); ps.setString(5,"ACTIVE"); ps.setObject(6,NOW); ps.setObject(7,NOW); ps.executeUpdate();
      }
    }
    try (PreparedStatement ps = c.prepareStatement("insert into teaching_class(id,course_id,code,name,grade,major,status,created_at,updated_at) values (?,?,?,?,?,?,?,?,?)")) {
      for (CourseSeed s : COURSES) {
        ps.setString(1,s.clsId); ps.setString(2,s.id); ps.setString(3,s.clsCode); ps.setString(4,s.clsName); ps.setString(5,"2026"); ps.setString(6,"\u8f6f\u4ef6\u5de5\u7a0b"); ps.setString(7,"ACTIVE"); ps.setObject(8,NOW); ps.setObject(9,NOW); ps.executeUpdate();
      }
    }
    try (PreparedStatement ps = c.prepareStatement("insert into teacher_class_assignment(id,user_id,class_id,assignment_role,created_at) values (?,?,?,?,?)")) {
      for (CourseSeed s : COURSES) { ps.setString(1,"tca-"+s.prefix.toLowerCase(Locale.ROOT)); ps.setString(2,"u-teacher-001"); ps.setString(3,s.clsId); ps.setString(4,"OWNER"); ps.setObject(5,NOW); ps.executeUpdate(); }
    }
    try (PreparedStatement ps = c.prepareStatement("insert into student_profile(id,user_id,student_no,class_id,class_name,grade,major,created_at,updated_at) values (?,?,?,?,?,?,?,?,?)")) {
      for (int i=1;i<=10;i++) {
        CourseSeed s = i <= 4 ? COURSES[0] : (i <= 7 ? COURSES[1] : COURSES[2]);
        String no = i == 1 ? "20260722120655" : String.format("202607221200%02d", i);
        ps.setString(1,"sp-"+String.format("%03d",i)); ps.setString(2,"u-student-"+String.format("%03d",i)); ps.setString(3,no); ps.setString(4,s.clsId); ps.setString(5,s.clsName); ps.setString(6,"2026"); ps.setString(7,"\u8f6f\u4ef6\u5de5\u7a0b"); ps.setObject(8,NOW); ps.setObject(9,NOW); ps.executeUpdate();
      }
    }
  }

  static void seedQuestionsAndPapers(Connection c) throws SQLException {
    try (PreparedStatement q = c.prepareStatement("insert into question(id,title,type,difficulty,source,status,score,answer_json,analysis,options_json,scoring_points_json,created_by,updated_at,course_id,course_name,reviewed_by,reviewed_at,review_comment,review_action) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
         PreparedStatement kp = c.prepareStatement("insert into question_knowledge_point(question_id,order_index,knowledge_point) values (?,?,?)");
         PreparedStatement paper = c.prepareStatement("insert into paper(id,title,course_name,description,duration_minutes,total_score,status,created_by,updated_at,course_id) values (?,?,?,?,?,?,?,?,?,?)");
         PreparedStatement pq = c.prepareStatement("insert into paper_question(id,paper_id,question_id,order_index,score) values (?,?,?,?,?)")) {
      for (CourseSeed s : COURSES) {
        paper.setString(1,s.paperId); paper.setString(2,s.paperTitle); paper.setString(3,s.name); paper.setString(4,"\u57fa\u7ebf 100 \u5206\u7efc\u5408\u8bd5\u5377\uff0c\u8986\u76d6\u5ba2\u89c2\u9898\u3001\u4e3b\u89c2\u9898\u548c\u7f16\u7a0b\u9898\u3002"); paper.setInt(5,120); paper.setBigDecimal(6,new BigDecimal("100")); paper.setString(7,"DRAFT"); paper.setString(8,"u-teacher-001"); paper.setObject(9,NOW); paper.setString(10,s.id); paper.executeUpdate();
        int order = 1;
        order = seedType(q,kp,pq,s,"SINGLE_CHOICE",10,new BigDecimal("1"),order);
        order = seedType(q,kp,pq,s,"MULTIPLE_CHOICE",10,new BigDecimal("2"),order);
        order = seedType(q,kp,pq,s,"TRUE_FALSE",10,new BigDecimal("1"),order);
        order = seedType(q,kp,pq,s,"FILL_BLANK",10,new BigDecimal("1"),order);
        order = seedType(q,kp,pq,s,"SHORT_ANSWER",4,new BigDecimal("5"),order);
        seedType(q,kp,pq,s,"PROGRAMMING",3,new BigDecimal("10"),order);
      }
    }
  }
  static int seedType(PreparedStatement q, PreparedStatement kp, PreparedStatement pq, CourseSeed s, String type, int count, BigDecimal score, int order) throws SQLException {
    String code = switch(type){case "SINGLE_CHOICE"->"SC";case "MULTIPLE_CHOICE"->"MC";case "TRUE_FALSE"->"TF";case "FILL_BLANK"->"FB";case "SHORT_ANSWER"->"SA";default->"PG";};
    for(int i=1;i<=count;i++){
      String id="q-"+s.prefix+"-"+code+"-"+String.format("%02d",i); QuestionData d=data(s.name,type,i);
      int n=1; q.setString(n++,id); q.setString(n++,d.title); q.setString(n++,type); q.setString(n++,difficulty(i)); q.setString(n++,"MANUAL"); q.setString(n++,"ACTIVE"); q.setBigDecimal(n++,score); q.setString(n++,d.answerJson); q.setString(n++,d.analysis); q.setString(n++,d.optionsJson); q.setString(n++,d.scoringJson); q.setString(n++,"u-teacher-001"); q.setObject(n++,NOW); q.setString(n++,s.id); q.setString(n++,s.name); q.setString(n++,"u-teacher-001"); q.setObject(n++,NOW); q.setString(n++,"\u57fa\u7ebf\u6570\u636e\uff0c\u5df2\u5ba1\u6838"); q.setString(n++,"ACCEPTED"); q.executeUpdate();
      kp.setString(1,id); kp.setInt(2,1); kp.setString(3,d.knowledge); kp.executeUpdate();
      pq.setString(1,"pq-"+s.prefix+"-"+String.format("%02d",order)); pq.setString(2,s.paperId); pq.setString(3,id); pq.setInt(4,order); pq.setBigDecimal(5,score); pq.executeUpdate(); order++;
    }
    return order;
  }
  static String difficulty(int i){String[] d={"VERY_EASY","EASY","MEDIUM","HARD","VERY_HARD"}; return d[(i-1)%d.length];}

  static QuestionData data(String course, String type, int i) {
    return switch(type) {
      case "SINGLE_CHOICE" -> new QuestionData(course + " \u5355\u9009\u9898 " + i + "\uff1a\u8bf7\u9009\u62e9\u6700\u7b26\u5408\u5de5\u7a0b\u89c4\u8303\u7684\u4e00\u9879\u3002", "\"A\"", "\u7b54\u6848 A \u5f3a\u8c03\u804c\u8d23\u6e05\u6670\u3001\u8fb9\u754c\u660e\u786e\u548c\u53ef\u7ef4\u62a4\u6027\u3002", options(new String[][]{{"A","\u804c\u8d23\u6e05\u6670\uff0c\u8fb9\u754c\u660e\u786e"},{"B","\u6240\u6709\u903b\u8f91\u96c6\u4e2d\u5230\u4e00\u4e2a\u6587\u4ef6"},{"C","\u5ffd\u7565\u5f02\u5e38\u5904\u7406"},{"D","\u4e0d\u4fdd\u7559\u5ba1\u8ba1\u8bb0\u5f55"}}), "[]", "\u5de5\u7a0b\u89c4\u8303");
      case "MULTIPLE_CHOICE" -> new QuestionData(course + " \u591a\u9009\u9898 " + i + "\uff1a\u7a33\u5b9a\u7cfb\u7edf\u901a\u5e38\u5e94\u5177\u5907\u54ea\u4e9b\u80fd\u529b\uff1f", "[\"A\",\"C\"]", "\u7a33\u5b9a\u7cfb\u7edf\u5e94\u5177\u5907\u6743\u9650\u8fb9\u754c\u3001\u5ba1\u8ba1\u8ffd\u8e2a\u548c\u53ef\u6062\u590d\u80fd\u529b\u3002", options(new String[][]{{"A","\u6743\u9650\u63a7\u5236"},{"B","\u5171\u4eab\u8d26\u53f7"},{"C","\u5173\u952e\u64cd\u4f5c\u5ba1\u8ba1"},{"D","\u53ea\u4f9d\u8d56\u524d\u7aef\u6821\u9a8c"}}), "[]", "\u7cfb\u7edf\u7a33\u5b9a\u6027");
      case "TRUE_FALSE" -> new QuestionData(course + " \u5224\u65ad\u9898 " + i + "\uff1a\u5173\u952e\u4e1a\u52a1\u64cd\u4f5c\u5e94\u5728\u540e\u7aef\u8fdb\u884c\u6743\u9650\u6821\u9a8c\u3002", "\"True\"", "\u5173\u952e\u4e1a\u52a1\u4e0d\u80fd\u53ea\u4f9d\u8d56\u524d\u7aef\u63a7\u5236\uff0c\u540e\u7aef\u5fc5\u987b\u6821\u9a8c\u6743\u9650\u3002", options(new String[][]{{"True","\u6b63\u786e"},{"False","\u9519\u8bef"}}), "[]", "\u6743\u9650\u6821\u9a8c");
      case "FILL_BLANK" -> new QuestionData(course + " \u586b\u7a7a\u9898 " + i + "\uff1a\u7528\u4e8e\u8bb0\u5f55\u5173\u952e\u64cd\u4f5c\u5e76\u652f\u6301\u8ffd\u6eaf\u7684\u80fd\u529b\u79f0\u4e3a____\u3002", "\"\u5ba1\u8ba1\"", "\u5ba1\u8ba1\u65e5\u5fd7\u7528\u4e8e\u5b89\u5168\u8ffd\u8e2a\u548c\u8d23\u4efb\u5b9a\u4f4d\u3002", "[]", scoring(new String[][]{{"SP-FB-1","\u5199\u51fa\u5ba1\u8ba1","1","\u5ba1\u8ba1","true"}}), "\u5ba1\u8ba1\u8ffd\u6eaf");
      case "SHORT_ANSWER" -> new QuestionData(course + " \u7b80\u7b54\u9898 " + i + "\uff1a\u8bf7\u8bf4\u660e\u4f01\u4e1a\u7ea7\u7cfb\u7edf\u4e3a\u4ec0\u4e48\u9700\u8981\u6570\u636e\u6821\u9a8c\u548c\u9519\u8bef\u5904\u7406\u3002", "\"\u5e94\u8bf4\u660e\u8f93\u5165\u6821\u9a8c\u3001\u4e1a\u52a1\u89c4\u5219\u6821\u9a8c\u3001\u5f02\u5e38\u63d0\u793a\u3001\u65e5\u5fd7\u8bb0\u5f55\u548c\u53ef\u6062\u590d\u6027\u3002\"", "\u7b54\u6848\u5e94\u8986\u76d6\u6821\u9a8c\u3001\u9632\u9519\u3001\u53ef\u89c2\u6d4b\u548c\u7528\u6237\u53cb\u597d\u63d0\u793a\u3002", "[]", scoring(new String[][]{{"SP-SA-1","\u8f93\u5165\u4e0e\u4e1a\u52a1\u6821\u9a8c","2","\u6821\u9a8c","true"},{"SP-SA-2","\u9519\u8bef\u63d0\u793a\u4e0e\u65e5\u5fd7","2","\u65e5\u5fd7","true"},{"SP-SA-3","\u53ef\u6062\u590d\u6027","1","\u6062\u590d","false"}}), "\u4f01\u4e1a\u7ea7\u8d28\u91cf");
      default -> new QuestionData(course + " \u7f16\u7a0b\u9898 " + i + "\uff1a\u5b9e\u73b0\u4e00\u4e2a\u51fd\u6570\uff0c\u7edf\u8ba1\u6570\u7ec4\u4e2d\u5927\u4e8e\u7b49\u4e8e 60 \u7684\u5143\u7d20\u6570\u91cf\u3002", "\"\u904d\u5386\u6570\u7ec4\uff0c\u5224\u65ad\u5143\u7d20\u662f\u5426\u5927\u4e8e\u7b49\u4e8e 60\uff0c\u6ee1\u8db3\u6761\u4ef6\u5219\u8ba1\u6570\u52a0\u4e00\u5e76\u8fd4\u56de\u8ba1\u6570\u3002\"", "\u8bc4\u5206\u5173\u6ce8\u904d\u5386\u3001\u6761\u4ef6\u5224\u65ad\u3001\u8fd4\u56de\u503c\u548c\u590d\u6742\u5ea6\u3002", "[]", scoring(new String[][]{{"SP-PG-1","\u6b63\u786e\u904d\u5386\u6570\u7ec4","3","\u904d\u5386","true"},{"SP-PG-2","\u5224\u65ad\u5927\u4e8e\u7b49\u4e8e 60","3","60","true"},{"SP-PG-3","\u8fd4\u56de\u6b63\u786e\u8ba1\u6570","3","return","true"},{"SP-PG-4","\u590d\u6742\u5ea6 O(n)","1","O(n)","false"}}), "\u7f16\u7a0b\u5b9e\u73b0");
    };
  }
  static String options(String[][] rows){ StringBuilder sb=new StringBuilder("["); for(int i=0;i<rows.length;i++){ if(i>0) sb.append(','); sb.append("{\"key\":\"").append(esc(rows[i][0])).append("\",\"content\":\"").append(esc(rows[i][1])).append("\"}"); } return sb.append(']').toString(); }
  static String scoring(String[][] rows){ StringBuilder sb=new StringBuilder("["); for(int i=0;i<rows.length;i++){ if(i>0) sb.append(','); sb.append("{\"id\":\"").append(esc(rows[i][0])).append("\",\"description\":\"").append(esc(rows[i][1])).append("\",\"score\":").append(rows[i][2]).append(",\"keywords\":[\"").append(esc(rows[i][3])).append("\"],\"required\":").append(rows[i][4]).append('}'); } return sb.append(']').toString(); }
  static String esc(String s){return s.replace("\\","\\\\").replace("\"","\\\"").replace("\r","\\r").replace("\n","\\n");}

  static void inspect() throws Exception {
    try(Connection c=DriverManager.getConnection(URL, USER, PASS); Statement st=c.createStatement()) {
      String[] qs={"select count(*) from course","select count(*) from paper","select count(*) from auth_user where id='u-teacher-001'","select count(*) from student_profile","select count(*) from question","select count(*) from exam"};
      for(String sql:qs) try(ResultSet rs=st.executeQuery(sql)){rs.next(); System.out.println(sql+" = "+rs.getLong(1));}
      try(ResultSet rs=st.executeQuery("select p.id,p.title,p.total_score,count(pq.question_id) from paper p join paper_question pq on pq.paper_id=p.id group by p.id,p.title,p.total_score order by p.id")){while(rs.next()) System.out.println("paper="+rs.getString(1)+", score="+rs.getBigDecimal(3)+", questions="+rs.getLong(4)+", title="+rs.getString(2));}
    }
  }
}
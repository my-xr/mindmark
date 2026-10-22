import java.sql.*;
public class DbCountTestExam {
  public static void main(String[] args) throws Exception {
    try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456")){
      String[] qs={"select count(*) from exam where id='exam-codex-scheduled-visibility'","select count(*) from exam_participant where exam_id='exam-codex-scheduled-visibility'","select count(*) from answer_sheet where exam_id='exam-codex-scheduled-visibility'"};
      for(String q:qs) try(Statement s=c.createStatement(); ResultSet r=s.executeQuery(q)){r.next(); System.out.println(r.getInt(1));}
    }
  }
}
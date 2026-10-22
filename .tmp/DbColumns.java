import java.sql.*;
public class DbColumns {
  public static void main(String[] args) throws Exception {
    String[] tables={"auth_user","auth_user_role","student_profile","course","teaching_class","teacher_class_assignment","question","question_knowledge_point","paper","paper_question","exam","exam_class","exam_participant","answer_sheet","answer_item","grading_task","grading_item","score_report","review_lecture_draft","review_artifact","ai_question_generation_task","ai_provider_setting"};
    try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456")){
      for(String t:tables){
        System.out.println("--- "+t+" ---");
        try(PreparedStatement ps=c.prepareStatement("select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name=? order by ordinal_position")){
          ps.setString(1,t);
          try(ResultSet rs=ps.executeQuery()){
            while(rs.next()) System.out.println(rs.getString(1)+"\t"+rs.getString(2)+"\t"+rs.getString(3)+"\t"+rs.getString(4));
          }
        }
      }
    }
  }
}

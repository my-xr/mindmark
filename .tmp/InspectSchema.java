import java.sql.*;
public class InspectSchema {
  public static void main(String[] args) throws Exception {
    try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456")){
      String[] tables={"auth_user","auth_role","auth_user_role","student_profile","course","teaching_class","teacher_class_assignment","question","paper","paper_question","exam","exam_class","exam_participant"};
      for(String t:tables){
        System.out.println("--- "+t+" ---");
        try(PreparedStatement ps=c.prepareStatement("select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name=? order by ordinal_position")){
          ps.setString(1,t);
          try(ResultSet rs=ps.executeQuery()){while(rs.next()) System.out.println(rs.getString(1)+" | "+rs.getString(2)+" | "+rs.getString(3)+" | "+rs.getString(4));}
        }
      }
    }
  }
}
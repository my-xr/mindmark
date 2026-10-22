import java.sql.*;
public class DbCheck {
  public static void main(String[] args) throws Exception {
    Class.forName("org.postgresql.Driver");
    try (Connection c = DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark", "postgres", "123456")) {
      try (PreparedStatement ps = c.prepareStatement("select id,username,name,student_id from auth_user where username=?")) {
        ps.setString(1, "20260722120655");
        try(ResultSet rs=ps.executeQuery()){ while(rs.next()) System.out.println("auth_user id="+rs.getString(1)+" username="+rs.getString(2)+" name="+rs.getString(3)+" student_id="+rs.getString(4)); }
      }
      try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery("select id,user_id,student_no,class_id,class_name from student_profile order by student_no limit 20")) {
        while(rs.next()) System.out.println("profile id="+rs.getString(1)+" user_id="+rs.getString(2)+" no="+rs.getString(3)+" class="+rs.getString(4)+" name="+rs.getString(5));
      }
    }
  }
}
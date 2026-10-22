import java.sql.*;
public class DbQueryUsers {
  public static void main(String[] args) throws Exception {
    try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456")){
      try(PreparedStatement ps=c.prepareStatement("select id,username,name,email,password_hash,must_change_password,student_id from auth_user where username in ('teacher@mindmark.local','20260722120655','202601345678') order by username")){
        try(ResultSet rs=ps.executeQuery()){ while(rs.next()) System.out.println(rs.getString(1)+"\t"+rs.getString(2)+"\t"+rs.getString(3)+"\t"+rs.getString(4)+"\t"+rs.getString(5)+"\t"+rs.getBoolean(6)+"\t"+rs.getString(7)); }
      }
    }
  }
}

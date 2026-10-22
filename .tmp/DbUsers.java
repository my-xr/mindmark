import java.sql.*;
public class DbUsers {
  public static void main(String[] args) throws Exception {
    try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456")){
      try(Statement s=c.createStatement(); ResultSet r=s.executeQuery("select u.id,u.username,u.name,u.must_change_password,string_agg(r.role, ',') as roles from auth_user u left join auth_user_role r on r.user_id=u.id group by u.id,u.username,u.name,u.must_change_password order by u.username limit 30")){
        while(r.next()) System.out.println(r.getString(1)+" | "+r.getString(2)+" | "+r.getString(3)+" | "+r.getString(5)+" | must="+r.getString(4));
      }
    }
  }
}
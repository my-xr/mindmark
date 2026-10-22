import java.sql.*;
public class DbInspect {
  public static void main(String[] args) throws Exception {
    String url="jdbc:postgresql://localhost:5432/mindmark";
    try(Connection c=DriverManager.getConnection(url,"postgres","123456")){
      query(c,"select u.id,u.username,u.name,u.student_id,sp.id as profile_id,sp.student_no,sp.class_id from auth_user u left join student_profile sp on sp.user_id=u.id where u.username like '202607221206%' or u.username like '%student%' or u.student_id is not null order by u.username limit 20");
      query(c,"select id,title,status,start_at,end_at from exam order by created_at desc limit 10");
      query(c,"select exam_id,class_id from exam_class order by exam_id,class_id limit 50");
      query(c,"select id,exam_id,student_id,student_name,class_id from exam_participant order by created_at desc limit 50");
    }
  }
  static void query(Connection c,String sql) throws Exception{
    System.out.println("--- "+sql);
    try(Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)){
      ResultSetMetaData m=r.getMetaData(); int n=m.getColumnCount();
      while(r.next()){
        for(int i=1;i<=n;i++) System.out.print(m.getColumnLabel(i)+"="+r.getString(i)+" | ");
        System.out.println();
      }
    }
  }
}
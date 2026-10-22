import java.sql.*;
public class VerifyChineseData {
  static String hex(String s){StringBuilder b=new StringBuilder(); s.codePoints().forEach(cp -> b.append(String.format("U+%04X ", cp))); return b.toString().trim();}
  public static void main(String[] args)throws Exception{try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456"); Statement st=c.createStatement()){
    try(ResultSet rs=st.executeQuery("select id,name from course order by id")){while(rs.next()) System.out.println(rs.getString(1)+" => "+hex(rs.getString(2)));}
    try(ResultSet rs=st.executeQuery("select title from question where id='q-FE-SC-01'")){rs.next(); System.out.println("q-FE-SC-01 => "+hex(rs.getString(1)));}
  }}
}
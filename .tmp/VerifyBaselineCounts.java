import java.sql.*;
public class VerifyBaselineCounts {
 public static void main(String[] args)throws Exception{try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456"); Statement st=c.createStatement()){
  String[] sqls={
   "select type,count(*),sum(score) from question group by type order by type",
   "select p.id,p.total_score,count(pq.question_id),sum(pq.score) from paper p join paper_question pq on p.id=pq.paper_id group by p.id,p.total_score order by p.id",
   "select status,count(*) from question group by status",
   "select source,count(*) from question group by source",
   "select role_code,count(*) from auth_user_role group by role_code order by role_code"
  };
  for(String sql:sqls){System.out.println("-- "+sql); try(ResultSet rs=st.executeQuery(sql)){ResultSetMetaData md=rs.getMetaData(); while(rs.next()){StringBuilder b=new StringBuilder(); for(int i=1;i<=md.getColumnCount();i++){if(i>1)b.append(" | "); b.append(rs.getString(i));} System.out.println(b);}}}
 }}
}
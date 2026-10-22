import java.sql.*;
import java.time.OffsetDateTime;
public class DbScheduledExamFixture {
  public static void main(String[] args) throws Exception {
    String mode=args.length>0?args[0]:"insert";
    String examId="exam-codex-scheduled-visibility";
    try(Connection c=DriverManager.getConnection("jdbc:postgresql://localhost:5432/mindmark","postgres","123456")){
      if("delete".equals(mode)){
        try(PreparedStatement ps=c.prepareStatement("delete from exam where id=?")){ps.setString(1,examId); System.out.println("deleted="+ps.executeUpdate());}
        return;
      }
      try(PreparedStatement ps=c.prepareStatement("delete from exam where id=?")){ps.setString(1,examId); ps.executeUpdate();}
      try(PreparedStatement ps=c.prepareStatement("insert into exam(id,title,paper_id,start_at,end_at,duration_minutes,total_score,status,created_by,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?)")){
        OffsetDateTime now=OffsetDateTime.now();
        ps.setString(1,examId);
        ps.setString(2,"Codex scheduled visibility check");
        ps.setString(3,"paper-fe-100");
        ps.setObject(4,now.plusHours(1));
        ps.setObject(5,now.plusHours(3));
        ps.setInt(6,90);
        ps.setBigDecimal(7,new java.math.BigDecimal("100.00"));
        ps.setString(8,"SCHEDULED");
        ps.setString(9,"u-teacher-001");
        ps.setObject(10,now);
        ps.setObject(11,now);
        ps.executeUpdate();
      }
      try(PreparedStatement ps=c.prepareStatement("insert into exam_class(exam_id,order_index,class_id) values(?,?,?)")){
        ps.setString(1,examId); ps.setInt(2,0); ps.setString(3,"class-frontend-001"); ps.executeUpdate();
      }
      System.out.println("inserted="+examId);
    }
  }
}
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.question.service.MarkdownQuestionParser;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class TestMarkdownParser {
    public static void main(String[] args) throws Exception {
        Path mdPath = Files.list(Path.of("exam")).filter(path -> path.getFileName().toString().endsWith(".md")).findFirst().orElseThrow();
        String md = Files.readString(mdPath, StandardCharsets.UTF_8);
        var result = new MarkdownQuestionParser(new ObjectMapper()).parse(md, "course", "CourseName");
        int bad = 0;
        for (var q : result.questions()) {
            String title = q.request().title();
            if (title.contains("##") || title.contains("题库统计") || title.contains("---")) {
                bad++;
                System.out.println("badTitle=" + q.sourceNo() + " => " + title.replace("\n", " | "));
            }
        }
        System.out.println("count=" + result.questions().size() + ", bad=" + bad);
    }
}
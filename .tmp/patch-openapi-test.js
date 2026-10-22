const fs = require('fs');
const p = 'apps/mindmark-server/src/test/java/com/mindmark/server/OpenApiContractTests.java';
let s = fs.readFileSync(p, 'utf8');
const insert = `
    @Test
    void courseScopedQuestionAndPaperContractIsDefined() throws Exception {
        String contract = Files.readString(Path.of("openapi", "mindmark-api.yaml"));

        assertThat(contract)
            .contains("/api/v1/courses:")
            .contains("enum: [VERY_EASY, EASY, MEDIUM, HARD, VERY_HARD]")
            .contains("- name: courseId")
            .contains("required: [courseId, prompt, questionType, difficulty, count]")
            .contains("courseId: { type: string }")
            .contains("Question course does not match paper course");
    }
`;
// Need contract has error string? it doesn't yet. Better don't include unless openapi description. We'll add description or remove.
const actualInsert = `
    @Test
    void courseScopedQuestionAndPaperContractIsDefined() throws Exception {
        String contract = Files.readString(Path.of("openapi", "mindmark-api.yaml"));

        assertThat(contract)
            .contains("/api/v1/courses:")
            .contains("enum: [VERY_EASY, EASY, MEDIUM, HARD, VERY_HARD]")
            .contains("- name: courseId")
            .contains("required: [courseId, prompt, questionType, difficulty, count]")
            .contains("courseId: { type: string }")
            .contains("AddPaperQuestionRequest:");
    }
`;
s = s.replace('\r\n}\r\n', actualInsert + '\r\n}\r\n');
fs.writeFileSync(p, s);

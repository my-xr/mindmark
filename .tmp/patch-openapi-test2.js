const fs = require('fs');
const p = 'apps/mindmark-server/src/test/java/com/mindmark/server/OpenApiContractTests.java';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('courseScopedQuestionAndPaperContractIsDefined')) {
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
            .contains("AddPaperQuestionRequest:");
    }
`;
  s = s.replace(/\n}\s*$/, insert + '\n}\n');
  fs.writeFileSync(p, s);
}

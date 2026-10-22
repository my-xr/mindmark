const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/web/PaperController.java';
let text = fs.readFileSync(path, 'utf8');
if (!text.includes('PaperComposePreviewResponse')) {
  text = text.replace('import com.mindmark.server.modules.paper.dto.PaperComposeRequest;\n', 'import com.mindmark.server.modules.paper.dto.PaperComposeRequest;\nimport com.mindmark.server.modules.paper.dto.PaperComposePreviewResponse;\nimport com.mindmark.server.modules.paper.dto.PaperComposeStrategy;\n');
}
if (!text.includes('previewComposeAgent')) {
  const marker = '    @PostMapping("/{paperId}/compose/random")\n';
  const block = `    @PostMapping("/{paperId}/compose/random/preview")
    public ApiResponse<PaperComposePreviewResponse> previewComposeRandom(
        @PathVariable String paperId,
        @Valid @RequestBody PaperComposeRequest request
    ) {
        return ApiResponse.success(paperService.previewCompose(paperId, request, PaperComposeStrategy.RANDOM));
    }

    @PostMapping("/{paperId}/compose/agent/preview")
    public ApiResponse<PaperComposePreviewResponse> previewComposeAgent(
        @PathVariable String paperId,
        @Valid @RequestBody PaperComposeRequest request
    ) {
        return ApiResponse.success(paperService.previewCompose(paperId, request, PaperComposeStrategy.AGENT));
    }

`;
  if (!text.includes(marker)) throw new Error('marker not found');
  text = text.replace(marker, block + marker);
}
fs.writeFileSync(path, text, 'utf8');

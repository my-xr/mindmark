from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java')
s=p.read_text(encoding='utf-8')
s=s.replace('import java.util.LinkedHashSet;\nimport java.util.List;', 'import java.util.LinkedHashMap;\nimport java.util.LinkedHashSet;\nimport java.util.List;\nimport java.util.Map;')
s=s.replace('''        Set<String> affectedPaperIds = new LinkedHashSet<>();
        int removed = 0;
        for (PaperQuestionEntity reference : references) {
            PaperEntity paper = reference.getPaper();
            if (paper.getStatus() == PaperStatus.PUBLISHED || paper.getStatus() == PaperStatus.ARCHIVED) {
                continue;
            }
            affectedPaperIds.add(paper.getId());
            paperQuestionRepository.delete(reference);
            removed += 1;
        }
        paperQuestionRepository.flush();

        for (String paperId : affectedPaperIds) {
            List<PaperQuestionEntity> remaining = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paperId);
            if (remaining.isEmpty()) {
                continue;
            }
            PaperEntity paper = remaining.get(0).getPaper();
            BigDecimal totalScore = BigDecimal.ZERO;
            for (int index = 0; index < remaining.size(); index += 1) {
                PaperQuestionEntity item = remaining.get(index);
                item.setOrderIndex(index + 1);
                totalScore = totalScore.add(item.getScore());
            }
            paper.setTotalScore(totalScore);
            paper.setUpdatedAt(OffsetDateTime.now());
            paperQuestionRepository.saveAll(remaining);
        }
''','''        Map<String, PaperEntity> affectedPapers = new LinkedHashMap<>();
        int removed = 0;
        for (PaperQuestionEntity reference : references) {
            PaperEntity paper = reference.getPaper();
            if (paper.getStatus() == PaperStatus.PUBLISHED || paper.getStatus() == PaperStatus.ARCHIVED) {
                continue;
            }
            affectedPapers.put(paper.getId(), paper);
            paperQuestionRepository.delete(reference);
            removed += 1;
        }
        paperQuestionRepository.flush();

        for (Map.Entry<String, PaperEntity> affectedPaper : affectedPapers.entrySet()) {
            List<PaperQuestionEntity> remaining = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(affectedPaper.getKey());
            BigDecimal totalScore = BigDecimal.ZERO;
            for (int index = 0; index < remaining.size(); index += 1) {
                PaperQuestionEntity item = remaining.get(index);
                item.setOrderIndex(index + 1);
                totalScore = totalScore.add(item.getScore());
            }
            PaperEntity paper = affectedPaper.getValue();
            paper.setTotalScore(totalScore);
            paper.setUpdatedAt(OffsetDateTime.now());
            paperQuestionRepository.saveAll(remaining);
        }
''')
p.write_text(s,encoding='utf-8')

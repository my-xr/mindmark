from pathlib import Path
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/service/ExamService.java')
text = p.read_text(encoding='utf-8')
old = '''        examParticipantRepository.findByStudentIdOrderByCreatedAtDesc(profile.getId())
            .forEach(participant -> participantByExamId.put(participant.getExam().getId(), participant));

        examRepository.findByClassIdOrderByStartAtDesc(profile.getClassId()).forEach(exam -> {
            participantByExamId.computeIfAbsent(
                exam.getId(),
                ignored -> examParticipantRepository.findByExamIdAndStudentId(exam.getId(), profile.getId())
                    .orElseGet(() -> createMissingParticipant(exam, profile, now))
            );
        });
'''
new = '''        examParticipantRepository.findByStudentIdOrderByCreatedAtDesc(profile.getId())
            .forEach(participant -> participantByExamId.put(participant.getExam().getId(), participant));
        examParticipantRepository.findByStudentIdOrderByCreatedAtDesc(profile.getStudentNo())
            .forEach(participant -> participantByExamId.putIfAbsent(
                participant.getExam().getId(),
                migrateLegacyParticipantStudentId(participant, profile, now)
            ));

        examRepository.findByClassIdOrderByStartAtDesc(profile.getClassId()).forEach(exam -> {
            participantByExamId.computeIfAbsent(
                exam.getId(),
                ignored -> findOrCreateParticipant(exam, profile, now)
            );
        });
'''
if old not in text:
    raise SystemExit('old list block not found')
text = text.replace(old, new)
old = '''    private ExamParticipantEntity createMissingParticipant(ExamEntity exam, StudentProfileEntity profile, OffsetDateTime now) {
        ExamParticipantEntity participant = new ExamParticipantEntity();
        participant.setId("EP-" + exam.getId() + "-" + profile.getId());
        participant.setExam(exam);
        participant.setStudentId(profile.getId());
        participant.setStudentName(resolveStudentName(profile));
        participant.setClassId(profile.getClassId());
        participant.setCreatedAt(now);
        return examParticipantRepository.save(participant);
    }

    private AnswerSheetEntity findOrCreateAnswerSheet(
'''
new = '''    private ExamParticipantEntity findOrCreateParticipant(ExamEntity exam, StudentProfileEntity profile, OffsetDateTime now) {
        return examParticipantRepository.findByExamIdAndStudentId(exam.getId(), profile.getId())
            .or(() -> examParticipantRepository.findByExamIdAndStudentId(exam.getId(), profile.getStudentNo())
                .map(participant -> migrateLegacyParticipantStudentId(participant, profile, now)))
            .orElseGet(() -> createMissingParticipant(exam, profile, now));
    }

    private ExamParticipantEntity createMissingParticipant(ExamEntity exam, StudentProfileEntity profile, OffsetDateTime now) {
        ExamParticipantEntity participant = new ExamParticipantEntity();
        participant.setId("EP-" + exam.getId() + "-" + profile.getId());
        participant.setExam(exam);
        participant.setStudentId(profile.getId());
        participant.setStudentName(resolveStudentName(profile));
        participant.setClassId(profile.getClassId());
        participant.setCreatedAt(now);
        return examParticipantRepository.save(participant);
    }

    private ExamParticipantEntity migrateLegacyParticipantStudentId(
        ExamParticipantEntity participant,
        StudentProfileEntity profile,
        OffsetDateTime now
    ) {
        if (profile.getId().equals(participant.getStudentId())) {
            return participant;
        }
        participant.setStudentId(profile.getId());
        participant.setStudentName(resolveStudentName(profile));
        participant.setClassId(profile.getClassId());
        return examParticipantRepository.save(participant);
    }

    private AnswerSheetEntity findOrCreateAnswerSheet(
'''
if old not in text:
    raise SystemExit('old create block not found')
text = text.replace(old, new)
p.write_text(text, encoding='utf-8', newline='')
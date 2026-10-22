UPDATE course_chapter
SET title = '未分章',
    description = '历史题目自动归入未分章，教师可继续维护章节归属',
    updated_at = CURRENT_TIMESTAMP
WHERE chapter_no = 0
  AND (title = '???' OR title IS NULL OR title = '');

UPDATE question
SET chapter_title = '未分章'
WHERE chapter_no = 0
  AND (chapter_title = '???' OR chapter_title IS NULL OR chapter_title = '');

CREATE TABLE IF NOT EXISTS question (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    type VARCHAR(32) NOT NULL,
    difficulty VARCHAR(32) NOT NULL,
    source VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    score NUMERIC(8, 2) NOT NULL,
    answer_json TEXT NOT NULL,
    analysis TEXT NOT NULL,
    options_json TEXT NOT NULL,
    scoring_points_json TEXT NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_question_type CHECK (type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'PROGRAMMING')),
    CONSTRAINT ck_question_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    CONSTRAINT ck_question_source CHECK (source IN ('MANUAL', 'AI', 'IMPORT')),
    CONSTRAINT ck_question_status CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'DISABLED')),
    CONSTRAINT ck_question_score CHECK (score >= 0)
);

CREATE TABLE IF NOT EXISTS question_knowledge_point (
    question_id VARCHAR(64) NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    knowledge_point VARCHAR(128) NOT NULL,
    PRIMARY KEY (question_id, order_index)
);

CREATE TABLE IF NOT EXISTS paper (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    course_name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    total_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_paper_status CHECK (status IN ('DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT ck_paper_duration CHECK (duration_minutes > 0),
    CONSTRAINT ck_paper_total_score CHECK (total_score >= 0)
);

CREATE TABLE IF NOT EXISTS paper_question (
    id VARCHAR(128) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES paper(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES question(id),
    order_index INTEGER NOT NULL,
    score NUMERIC(8, 2) NOT NULL,
    CONSTRAINT ck_paper_question_order CHECK (order_index > 0),
    CONSTRAINT ck_paper_question_score CHECK (score >= 0),
    CONSTRAINT uk_paper_question_question UNIQUE (paper_id, question_id),
    CONSTRAINT uk_paper_question_order UNIQUE (paper_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_question_filter ON question(type, difficulty, status, source);
CREATE INDEX IF NOT EXISTS idx_question_updated_at ON question(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_knowledge_point ON question_knowledge_point(knowledge_point);
CREATE INDEX IF NOT EXISTS idx_paper_updated_at ON paper(updated_at DESC);

INSERT INTO question (id, title, type, difficulty, source, status, score, answer_json, analysis, options_json, scoring_points_json, created_by, updated_at) VALUES
('Q-1001', 'Which JavaScript method parses a JSON string into an object?', 'SINGLE_CHOICE', 'EASY', 'MANUAL', 'ACTIVE', 2, '"B"', 'JSON.parse deserializes a JSON string, while JSON.stringify serializes an object.', '[{"key":"A","content":"JSON.stringify()"},{"key":"B","content":"JSON.parse()"},{"key":"C","content":"Object.assign()"},{"key":"D","content":"Array.from()"}]', '[]', 'Teacher Wang', '2026-07-17 09:20:00+08'),
('Q-1002', 'Which statements about Vue 3 Composition API are correct?', 'MULTIPLE_CHOICE', 'MEDIUM', 'AI', 'PENDING_REVIEW', 4, '["A","C"]', 'ref declares reactive primitive values; computed is for derived state; watchEffect tracks dependencies automatically.', '[{"key":"A","content":"ref can declare reactive state"},{"key":"B","content":"computed must be manually invoked to recalculate"},{"key":"C","content":"watchEffect tracks dependencies automatically"},{"key":"D","content":"setup can only return strings"}]', '[]', 'AI Mock', '2026-07-17 10:10:00+08'),
('Q-1003', 'HTTP status code 404 means internal server error.', 'TRUE_FALSE', 'EASY', 'IMPORT', 'ACTIVE', 1, '"False"', '404 means resource not found; 500 means internal server error.', '[]', '[]', 'Import Job #12', '2026-07-16 18:30:00+08'),
('Q-1004', 'The four basic characteristics of database transactions are abbreviated as ____.', 'FILL_BLANK', 'MEDIUM', 'MANUAL', 'DRAFT', 2, '"ACID"', 'ACID means atomicity, consistency, isolation and durability.', '[]', '[{"id":"SP-1004-1","description":"Write ACID correctly","score":2,"keywords":["ACID"],"required":true}]', 'Teacher Li', '2026-07-15 14:05:00+08'),
('Q-1005', 'Briefly explain the relationship between resources, URIs and HTTP methods in RESTful APIs.', 'SHORT_ANSWER', 'HARD', 'MANUAL', 'ACTIVE', 8, '"Resources are identified by URIs and manipulated through HTTP methods such as GET, POST, PUT and DELETE."', 'A good answer should mention resource modeling, URI naming and method semantics.', '[]', '[{"id":"SP-1005-1","description":"Explain resources and URIs","score":3,"keywords":["resource","URI"],"required":true},{"id":"SP-1005-2","description":"Explain HTTP method semantics","score":5,"keywords":["GET","POST","PUT","DELETE"],"required":true}]', 'Teacher Wang', '2026-07-16 15:20:00+08'),
('Q-1006', 'Implement a debounce function in JavaScript.', 'PROGRAMMING', 'HARD', 'MANUAL', 'ACTIVE', 10, '"Function implementation omitted in seed data."', 'A complete answer should handle timer reset and preserve arguments and this binding.', '[]', '[{"id":"SP-1006-1","description":"Clear previous timer","score":3,"keywords":["clearTimeout"],"required":true},{"id":"SP-1006-2","description":"Create delayed execution","score":4,"keywords":["setTimeout"],"required":true},{"id":"SP-1006-3","description":"Preserve context and args","score":3,"keywords":["apply","args"],"required":false}]', 'Teacher Li', '2026-07-16 16:00:00+08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_knowledge_point (question_id, order_index, knowledge_point) VALUES
('Q-1001', 0, 'JavaScript Basics'),
('Q-1001', 1, 'JSON'),
('Q-1002', 0, 'Vue 3'),
('Q-1002', 1, 'Composition API'),
('Q-1003', 0, 'HTTP Protocol'),
('Q-1003', 1, 'Status Code'),
('Q-1004', 0, 'Database'),
('Q-1004', 1, 'Transaction'),
('Q-1005', 0, 'RESTful API'),
('Q-1005', 1, 'HTTP Method'),
('Q-1006', 0, 'JavaScript Advanced'),
('Q-1006', 1, 'Function Utility')
ON CONFLICT (question_id, order_index) DO NOTHING;

INSERT INTO paper (id, title, course_name, description, duration_minutes, total_score, status, created_by, updated_at) VALUES
('paper-001', 'Frontend Engineering Quiz A', 'Frontend Engineering', 'Covers JavaScript, Vue 3, HTTP and API basics.', 90, 16, 'READY', 'Teacher Wang', '2026-07-17 11:20:00+08'),
('paper-002', 'Full-stack Web Practice Paper', 'Full-stack Web Development', 'Covers database, API design and advanced JavaScript.', 120, 23, 'DRAFT', 'Teacher Li', '2026-07-16 17:45:00+08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO paper_question (id, paper_id, question_id, order_index, score) VALUES
('PQ-Q-1001', 'paper-001', 'Q-1001', 1, 2),
('PQ-Q-1002', 'paper-001', 'Q-1002', 2, 4),
('PQ-Q-1003', 'paper-001', 'Q-1003', 3, 2),
('PQ-Q-1005', 'paper-001', 'Q-1005', 4, 8),
('PQ-paper-002-Q-1001', 'paper-002', 'Q-1001', 1, 2),
('PQ-paper-002-Q-1004', 'paper-002', 'Q-1004', 2, 3),
('PQ-paper-002-Q-1005', 'paper-002', 'Q-1005', 3, 8),
('PQ-paper-002-Q-1006', 'paper-002', 'Q-1006', 4, 10)
ON CONFLICT (id) DO NOTHING;
create table if not exists grading_ai_job (
    id varchar(96) primary key,
    grading_task_id varchar(96) not null references grading_task(id) on delete cascade,
    status varchar(32) not null,
    teacher_id varchar(64) not null,
    provider varchar(32),
    model varchar(128),
    subjective_item_count integer not null default 0,
    processed_item_count integer not null default 0,
    refreshed_item_count integer not null default 0,
    error_message text,
    created_at timestamptz not null,
    started_at timestamptz,
    finished_at timestamptz,
    updated_at timestamptz not null
);

create index if not exists idx_grading_ai_job_task_created on grading_ai_job(grading_task_id, created_at desc);
create index if not exists idx_grading_ai_job_status_created on grading_ai_job(status, created_at asc);
create index if not exists idx_grading_ai_job_teacher_updated on grading_ai_job(teacher_id, updated_at desc);

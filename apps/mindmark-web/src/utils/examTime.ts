export type ExamTimingPhase = 'BEFORE_START' | 'IN_WINDOW' | 'ENDED' | 'UNKNOWN';

export interface ExamTimingInfo {
  phase: ExamTimingPhase;
  countdownText: string;
  helperText: string;
  startMs: number;
  endMs: number;
}

const normalizeDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.replace(' ', 'T');
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? `${normalized}:00`
    : normalized;

  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(withSeconds) ? withSeconds : `${withSeconds}+08:00`;
};

export const parseExamDateTime = (value?: string | null) => {
  if (!value) {
    return Number.NaN;
  }

  const timestamp = Date.parse(normalizeDateInput(value));

  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
};

export const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const getExamTimingInfo = (
  startAt?: string | null,
  endAt?: string | null,
  nowMs = Date.now(),
): ExamTimingInfo => {
  const startMs = parseExamDateTime(startAt);
  const endMs = parseExamDateTime(endAt);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return {
      phase: 'UNKNOWN',
      countdownText: '',
      helperText: '考试时间待确认',
      startMs,
      endMs,
    };
  }

  if (nowMs < startMs) {
    const countdownText = formatCountdown(startMs - nowMs);

    return {
      phase: 'BEFORE_START',
      countdownText,
      helperText: `距离考试开始还有 ${countdownText}`,
      startMs,
      endMs,
    };
  }

  if (nowMs <= endMs) {
    const countdownText = formatCountdown(endMs - nowMs);

    return {
      phase: 'IN_WINDOW',
      countdownText,
      helperText: `考试进行中，距离结束还有 ${countdownText}`,
      startMs,
      endMs,
    };
  }

  return {
    phase: 'ENDED',
    countdownText: '',
    helperText: '考试时间已结束',
    startMs,
    endMs,
  };
};

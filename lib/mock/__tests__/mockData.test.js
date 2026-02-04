import { mockPlannerBundle, mockTaskDetail, mockFeedbacks, mockProgress } from '../mockData';

describe('mockPlannerBundle', () => {
  it('returns a planner bundle object', () => {
    const result = mockPlannerBundle('2026-02-01');
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('returns object with headerNote property', () => {
    const result = mockPlannerBundle('2026-02-01');
    expect(result).toHaveProperty('headerNote');
    expect(typeof result.headerNote).toBe('string');
  });

  it('returns object with tasks array', () => {
    const result = mockPlannerBundle('2026-02-01');
    expect(result).toHaveProperty('tasks');
    expect(Array.isArray(result.tasks)).toBe(true);
  });

  it('returns tasks with correct structure', () => {
    const result = mockPlannerBundle('2026-02-01');
    expect(result.tasks.length).toBeGreaterThan(0);

    result.tasks.forEach((task) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('subject');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('studyMinutes');
    });
  });

  it('returns tasks with valid status values', () => {
    const result = mockPlannerBundle('2026-02-01');
    const validStatuses = ['TODO', 'WORKING', 'DONE'];

    result.tasks.forEach((task) => {
      expect(validStatuses).toContain(task.status);
    });
  });

  it('returns tasks with non-negative studyMinutes', () => {
    const result = mockPlannerBundle('2026-02-01');

    result.tasks.forEach((task) => {
      expect(task.studyMinutes).toBeGreaterThanOrEqual(0);
      expect(typeof task.studyMinutes).toBe('number');
    });
  });

  it('returns consistent data for same date', () => {
    const result1 = mockPlannerBundle('2026-02-01');
    const result2 = mockPlannerBundle('2026-02-01');

    expect(result1).toEqual(result2);
  });

  it('handles different date formats', () => {
    const dates = ['2026-02-01', '2026-12-31', '2026-01-01'];

    dates.forEach((date) => {
      const result = mockPlannerBundle(date);
      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
    });
  });

  it('returns tasks with unique ids', () => {
    const result = mockPlannerBundle('2026-02-01');
    const ids = result.tasks.map((task) => task.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('mockTaskDetail', () => {
  it('returns a task detail object', () => {
    const result = mockTaskDetail('t1');
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('returns object with id property', () => {
    const taskId = 't1';
    const result = mockTaskDetail(taskId);
    expect(result).toHaveProperty('id');
    expect(result.id).toBe(taskId);
  });

  it('returns object with title property', () => {
    const result = mockTaskDetail('t1');
    expect(result).toHaveProperty('title');
    expect(typeof result.title).toBe('string');
  });

  it('returns object with subject property', () => {
    const result = mockTaskDetail('t1');
    expect(result).toHaveProperty('subject');
    expect(typeof result.subject).toBe('string');
  });

  it('returns object with pdfUrl property', () => {
    const result = mockTaskDetail('t1');
    expect(result).toHaveProperty('pdfUrl');
    expect(typeof result.pdfUrl).toBe('string');
  });

  it('uses the provided taskId in the result', () => {
    const taskId = 'custom-task-123';
    const result = mockTaskDetail(taskId);
    expect(result.id).toBe(taskId);
    expect(result.title).toContain(taskId);
  });

  it('handles different taskId formats', () => {
    const taskIds = ['t1', 't2', 'task-123', 'TASK_456'];

    taskIds.forEach((taskId) => {
      const result = mockTaskDetail(taskId);
      expect(result.id).toBe(taskId);
    });
  });

  it('returns consistent data for same taskId', () => {
    const result1 = mockTaskDetail('t1');
    const result2 = mockTaskDetail('t1');

    expect(result1).toEqual(result2);
  });
});

describe('mockFeedbacks', () => {
  it('returns an array', () => {
    const result = mockFeedbacks();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns non-empty array', () => {
    const result = mockFeedbacks();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns feedback objects with correct structure', () => {
    const result = mockFeedbacks();

    result.forEach((feedback) => {
      expect(feedback).toHaveProperty('id');
      expect(feedback).toHaveProperty('subject');
      expect(feedback).toHaveProperty('date');
      expect(feedback).toHaveProperty('summary');
      expect(feedback).toHaveProperty('body');
    });
  });

  it('returns feedback with string properties', () => {
    const result = mockFeedbacks();

    result.forEach((feedback) => {
      expect(typeof feedback.id).toBe('string');
      expect(typeof feedback.subject).toBe('string');
      expect(typeof feedback.date).toBe('string');
      expect(typeof feedback.summary).toBe('string');
      expect(typeof feedback.body).toBe('string');
    });
  });

  it('returns feedback with unique ids', () => {
    const result = mockFeedbacks();
    const ids = result.map((feedback) => feedback.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('returns feedback with valid date format', () => {
    const result = mockFeedbacks();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    result.forEach((feedback) => {
      expect(feedback.date).toMatch(dateRegex);
    });
  });

  it('returns feedback with non-empty required fields', () => {
    const result = mockFeedbacks();

    result.forEach((feedback) => {
      expect(feedback.id.length).toBeGreaterThan(0);
      expect(feedback.subject.length).toBeGreaterThan(0);
      expect(feedback.date.length).toBeGreaterThan(0);
      expect(feedback.summary.length).toBeGreaterThan(0);
      expect(feedback.body.length).toBeGreaterThan(0);
    });
  });

  it('returns consistent data on multiple calls', () => {
    const result1 = mockFeedbacks();
    const result2 = mockFeedbacks();

    expect(result1).toEqual(result2);
  });

  it('returns feedback with expected subjects', () => {
    const result = mockFeedbacks();
    const subjects = result.map((f) => f.subject);

    expect(subjects).toContain('KOR');
    expect(subjects).toContain('ENG');
    expect(subjects).toContain('MATH');
  });

  it('returns exactly 3 feedback items', () => {
    const result = mockFeedbacks();
    expect(result.length).toBe(3);
  });

  it('returns feedback with Korean text in summary', () => {
    const result = mockFeedbacks();

    result.forEach((feedback) => {
      expect(feedback.summary).toContain('핵심:');
    });
  });
});

describe('mockProgress', () => {
  it('returns an object', () => {
    const result = mockProgress();
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  it('returns object with subject properties', () => {
    const result = mockProgress();
    expect(result).toHaveProperty('KOR');
    expect(result).toHaveProperty('ENG');
    expect(result).toHaveProperty('MATH');
  });

  it('returns numeric progress values', () => {
    const result = mockProgress();

    Object.values(result).forEach((value) => {
      expect(typeof value).toBe('number');
    });
  });

  it('returns progress values within valid range', () => {
    const result = mockProgress();

    Object.values(result).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it('returns specific progress values for each subject', () => {
    const result = mockProgress();

    expect(result.KOR).toBe(62);
    expect(result.ENG).toBe(48);
    expect(result.MATH).toBe(55);
  });

  it('returns consistent data on multiple calls', () => {
    const result1 = mockProgress();
    const result2 = mockProgress();

    expect(result1).toEqual(result2);
  });

  it('has exactly three subjects', () => {
    const result = mockProgress();
    const keys = Object.keys(result);

    expect(keys.length).toBe(3);
  });

  it('does not return negative values', () => {
    const result = mockProgress();

    Object.values(result).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  it('returns integer values', () => {
    const result = mockProgress();

    Object.values(result).forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
    });
  });
});

describe('mockData module integration', () => {
  it('exports all required functions', () => {
    expect(typeof mockPlannerBundle).toBe('function');
    expect(typeof mockTaskDetail).toBe('function');
    expect(typeof mockFeedbacks).toBe('function');
    expect(typeof mockProgress).toBe('function');
  });

  it('all functions return defined values', () => {
    expect(mockPlannerBundle('2026-02-01')).toBeDefined();
    expect(mockTaskDetail('t1')).toBeDefined();
    expect(mockFeedbacks()).toBeDefined();
    expect(mockProgress()).toBeDefined();
  });

  it('mockPlannerBundle tasks subjects match mockProgress subjects', () => {
    const bundle = mockPlannerBundle('2026-02-01');
    const progress = mockProgress();
    const progressSubjects = Object.keys(progress);

    bundle.tasks.forEach((task) => {
      // All task subjects should be in the progress tracking
      expect(progressSubjects).toContain(task.subject);
    });
  });

  it('mockFeedbacks subjects match mockProgress subjects', () => {
    const feedbacks = mockFeedbacks();
    const progress = mockProgress();
    const progressSubjects = Object.keys(progress);

    feedbacks.forEach((feedback) => {
      expect(progressSubjects).toContain(feedback.subject);
    });
  });
});
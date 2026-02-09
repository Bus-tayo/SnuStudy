import { supabase } from '@/lib/supabase/client';

export const fetchStudySessions = async ({ menteeId, date }) => {
  // Date format: YYYY-MM-DD
  if (!menteeId) return [];

  // Start of the planner day: 06:00 AM
  const startRange = new Date(date);
  startRange.setHours(6, 0, 0, 0);

  // End of the planner day: Next Day 02:00 AM
  const endRange = new Date(date);
  endRange.setDate(endRange.getDate() + 1);
  endRange.setHours(2, 0, 0, 0);

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      task:tasks(id, title, subject)
    `)
    .eq('mentee_id', menteeId)
    .gte('started_at', startRange.toISOString())
    .lt('started_at', endRange.toISOString())
    .order('started_at', { ascending: true });

  if (error) {
    console.error('Error fetching study sessions:', error);
    throw error;
  }

  // Transform for frontend usage
  return data.map(session => ({
    id: session.id,
    taskId: session.task_id,
    // Use task title if available, otherwise fall back to content
    content: session.task?.title || session.content || '삭제된 과제',
    subject: session.task?.subject || null,
    startTime: session.started_at,
    endTime: session.ended_at,
    color: session.color || '#6366F1'
  }));
};

export const addStudySession = async ({ menteeId, taskId, startTime, endTime, color }) => {
  // First, fetch the task title to use as content (fallback/constraint)
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('title')
    .eq('id', taskId)
    .single();

  if (taskError) {
    console.error('Error fetching task for session:', taskError);
    throw taskError;
  }

  const taskTitle = taskData?.title || 'Unknown Task';

  // startTime, endTime: ISO strings
  const payload = {
    mentee_id: menteeId,
    task_id: taskId,
    content: taskTitle, // Save title as content to satisfy NOT NULL constraint
    started_at: startTime,
    ended_at: endTime,
    color: color || '#6366F1'
  };

  const { data, error } = await supabase
    .from('study_sessions')
    .insert([payload])
    .select(`
      *,
      task:tasks(id, title, subject)
    `)
    .single();

  if (error) {
    console.error('Error adding study session:', error);
    throw error;
  }

  return {
    id: data.id,
    taskId: data.task_id,
    content: data.task?.title || data.content || '과제',
    subject: data.task?.subject || null,
    startTime: data.started_at,
    endTime: data.ended_at,
    color: data.color || '#6366F1'
  };
};

export const deleteStudySession = async (sessionId) => {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting study session:', error);
    throw error;
  }
};

export const updateStudySession = async ({ sessionId, taskId, color }) => {
  // Fetch task title for content constraint
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select('title')
    .eq('id', taskId)
    .single();

  if (taskError) {
    console.error('Error fetching task for session update:', taskError);
    throw taskError;
  }

  const taskTitle = taskData?.title || 'Unknown Task';

  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      task_id: taskId,
      content: taskTitle,
      color: color || '#6366F1'
      // updated_at column does not exist in current schema
    })
    .eq('id', sessionId)
    .select(`
      *,
      task:tasks(id, title, subject)
    `)
    .single();

  if (error) {
    console.error('Error updating study session:', error);
    throw error;
  }

  return {
    id: data.id,
    taskId: data.task_id,
    content: data.task?.title || data.content || '과제',
    subject: data.task?.subject || null,
    startTime: data.started_at,
    endTime: data.ended_at,
    color: data.color || '#6366F1'
  };
};

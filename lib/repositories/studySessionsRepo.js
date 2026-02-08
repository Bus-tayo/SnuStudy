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
    .select('*')
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
    content: session.content,
    startTime: session.started_at,
    endTime: session.ended_at,
    color: session.color || '#6366F1' // Read color from DB
  }));
};

export const addStudySession = async ({ menteeId, content, startTime, endTime, color }) => {
  // startTime, endTime: ISO strings
  const payload = {
    mentee_id: menteeId,
    content,
    started_at: startTime,
    ended_at: endTime,
    color: color || '#6366F1' // Save color to DB
  };

  const { data, error } = await supabase
    .from('study_sessions')
    .insert([payload])
    .select()
    .single(); // Return single object

  if (error) {
    console.error('Error adding study session:', error);
    throw error;
  }
  return data;
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

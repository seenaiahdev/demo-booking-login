// Purpose: Helper utilities for fetching and persisting video watch state directly with the Supabase video_progress backend database.

export const saveUserProgressLocal = () => {};
export const getUserProgressLocal = () => ({ currentTime: 0, completed: false });

export const syncProgressWithBackend = async (userId, currentTime, completed) => {
  if (!userId) return;
  try {
    await fetch(`/api/progress/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentTime, completed })
    });
  } catch (err) {
    console.warn('Backend progress sync notice:', err);
  }
};

export const fetchProgressFromBackend = async (userId) => {
  if (!userId) return { currentTime: 0, completed: false };
  try {
    const res = await fetch(`/api/progress/${userId}`);
    const json = await res.json();
    if (json.success && json.progress) {
      return {
        currentTime: json.progress.currentTime || 0,
        completed: !!json.progress.completed
      };
    }
  } catch (err) {
    console.warn('Backend progress fetch notice:', err);
  }
  return { currentTime: 0, completed: false };
};

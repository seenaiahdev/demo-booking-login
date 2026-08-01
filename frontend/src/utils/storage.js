// Purpose: Helper utilities for fetching and persisting video watch state directly with the Supabase video_progress backend database.

export const saveUserProgressLocal = () => {};
export const getUserProgressLocal = () => ({ currentTime: 0, completed: false });

export const syncProgressWithBackend = async (userOrId, currentTime, completed) => {
  const userId = typeof userOrId === 'object' ? userOrId?.id : userOrId;
  if (!userId) return;

  const payload = {
    currentTime,
    completed,
    registration_id: typeof userOrId === 'object' ? userOrId?.registration_id : '',
    name: typeof userOrId === 'object' ? userOrId?.name : '',
    email: typeof userOrId === 'object' ? userOrId?.email : '',
    mbnum: typeof userOrId === 'object' ? userOrId?.mbnum : ''
  };

  try {
    await fetch(`/api/progress/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

import { Space } from '@/types/Space';

const API_BASE = 'http://localhost:8085/api/spaces';
const STORAGE_KEY = 'current_space_id';

export const getCurrentSpaceId = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || 'default';
  }
  return 'default';
};

export const setCurrentSpaceId = (id: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, id);
    // Dispatch a custom event to notify listeners
    window.dispatchEvent(new Event('spaceChanged'));
  }
};

export const fetchSpaces = async (): Promise<Space[]> => {
  try {
    const res = await fetch(API_BASE);
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch spaces', error);
  }
  return [];
};

export const createSpace = async (space: Space): Promise<Space | null> => {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(space),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('Failed to create space', error);
  }
  return null;
};

export const deleteSpace = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('Failed to delete space', error);
        return false;
    }
};

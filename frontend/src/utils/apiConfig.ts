import { getCurrentSpaceId } from './spaceManager';

const BASE_URL = 'http://localhost:8080/api';

export const getBaseUrl = () => BASE_URL;

export const getSpaceApiUrl = (endpoint: string) => {
  const spaceId = getCurrentSpaceId();
  // Ensure endpoint doesn't start with / to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${BASE_URL}/spaces/${spaceId}/${cleanEndpoint}`;
};

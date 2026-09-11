export const API_BASE_URL =
  process.env.NEXT_PUBLIC_MECHANIC_API || 'http://localhost:4000/api/mechanic';

// Base for serving uploaded files. The backend serves each module's uploads
// under that module's own API prefix (/api/mechanic/uploads/...), so stored
// paths resolve against the API base itself.
export const API_ORIGIN = API_BASE_URL.replace(/\/$/, '');

export const TOKEN_KEY = 'am_mechanic_token';
export const USER_KEY = 'am_mechanic_user';

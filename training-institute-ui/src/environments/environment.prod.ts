/**
 * Production build: the API is called on the same origin ("/api") and
 * vercel.json forwards those requests to the deployed Spring Boot backend.
 */
export const environment = {
  apiUrl: '/api',
};

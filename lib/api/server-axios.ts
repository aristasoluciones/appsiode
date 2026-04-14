import axios from 'axios';
import https from 'https';

const API_AUTH_URL = process.env.API_AUTH_URL || 'http://localhost:5075/api';

const serverApi = axios.create({
  baseURL: API_AUTH_URL,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
  // Ignore self-signed certificates in development (.NET dev certs)
  ...(process.env.NODE_ENV !== 'production' && {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  }),
});

export default serverApi;

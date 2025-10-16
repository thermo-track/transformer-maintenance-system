import apiClient from '../../config/api.js';

// Use the authenticated apiClient instead of creating a new axios instance
const http = apiClient;


export async function listTransformers({ page=0, size=10, by, q, range }) {
   const params = { page, size };
   if (q)  params.q  = q;
   if (by) params.by = by;
   // If your backend supports date filtering, send from/to based on range.
   // If not, these extra params will be ignored by the server.
   if (range && range !== 'all') {
     const now = new Date();
     const to = now.toISOString();
     const fromDate = new Date(now);
     if (range === '7d')  fromDate.setDate(now.getDate() - 7);
     if (range === '30d') fromDate.setDate(now.getDate() - 30);
     if (range === '90d') fromDate.setDate(now.getDate() - 90);
     params.from = fromDate.toISOString();
     params.to   = to;
   }
   const { data } = await http.get('/api/transformers', { params });
   return data;
 }


export async function getTransformer(id) {
const { data } = await http.get(`/api/transformers/${id}`);
return data;
}


export async function createTransformer(payload) {
const { data } = await http.post('/api/transformers', payload);
return data;
}


export async function updateTransformer(id, payload) {
const { data } = await http.put(`/api/transformers/${id}`, payload);
return data;
}


export async function deleteTransformer(id) {
await http.delete(`/api/transformers/${id}`);
}


// Optional meta endpoint support. If your backend doesn't have it, this will fail
// and the UI will fall back to constants.
export async function fetchMeta() {
try {
const { data } = await http.get('/api/transformers/meta');
const regions = Array.isArray(data?.regions) ? data.regions : null;
const types = Array.isArray(data?.types) ? data.types : null;
if (regions && types) return { regions, types };
} catch (_) {
// ignore
}
return null;
}
import axios from 'axios';
import { API_BASE_URL } from '../../config/env.js';


const http = axios.create({ baseURL: API_BASE_URL });


http.interceptors.response.use(
r => r,
err => {
const msg = err?.response?.data?.message || err.message || 'Request failed';
return Promise.reject(new Error(msg));
}
);


export async function listTransformers({ page = 0, size = 20 } = {}) {
const { data } = await http.get('/api/transformers', { params: { page, size } });
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
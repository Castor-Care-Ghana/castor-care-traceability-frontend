// src/api/traceability.js
import { apiClient } from "./config";

// ===================== USERS =====================
export const apiGetUsers = async () => apiClient.get("/users");
export const apiGetUserById = async (id) => apiClient.get(`/users/${id}`);
export const apiCreateUser = async (payload) => apiClient.post("/users", payload);
export const apiUpdateUser = async (id, payload) => apiClient.patch(`/users/${id}`, payload);
export const apiDeleteUser = async (id) => apiClient.delete(`/users/${id}`);

// ===================== FARMERS =====================
export const apiGetFarmers = async () => apiClient.get("/farmers");
export const apiGetFarmerById = async (id) => apiClient.get(`/farmers/${id}`);
export const apiCreateFarmer = async (payload) => apiClient.post("/farmers", payload);
export const apiUpdateFarmer = async (id, payload) => apiClient.patch(`/farmers/${id}`, payload);
export const apiDeleteFarmer = async (id) => apiClient.delete(`/farmers/${id}`);

// ===================== BATCHES =====================
export const apiGetBatches = async () => apiClient.get("/batches");
export const apiGetBatchById = async (id) => apiClient.get(`/batches/${id}`);
export const apiCreateBatch = async (payload) => apiClient.post("/batches", payload);
export const apiUpdateBatch = async (id, payload) => apiClient.patch(`/batches/${id}`, payload);
export const apiDeleteBatch = async (id) => apiClient.delete(`/batches/${id}`);

// ===================== PACKAGES =====================
export const apiGetPackages = async () => apiClient.get("/packages");
export const apiGetPackageById = async (id) => apiClient.get(`/packages/${id}`);
export const apiCreatePackage = async (payload) => apiClient.post("/packages", payload);
export const apiUpdatePackage = async (id, payload) => apiClient.patch(`/packages/${id}`, payload);
export const apiDeletePackage = async (id) => apiClient.delete(`/packages/${id}`);

// ===================== SCANS =====================
export const apiGetScans = async () => apiClient.get("/scans");
export const apiGetScanById = async (id) => apiClient.get(`/scans/${id}`);
export const apiCreateScan = async (payload) => apiClient.post("/scans", payload);
export const apiUpdateScan = async (id, payload) => apiClient.patch(`/scans/${id}`, payload);
export const apiDeleteScan = async (id) => apiClient.delete(`/scans/${id}`);

// ===================== RELATIONSHIP QUERIES =====================
// Farmer → Batches
export const apiGetFarmerBatches = async (farmerId) => apiClient.get(`/farmers/${farmerId}/batches`);
// Batch → Packages
export const apiGetBatchPackages = async (batchId) => apiClient.get(`/batches/${batchId}/packages`);
// Package → Scans
export const apiGetPackageScans = async (packageId) => apiClient.get(`/packages/${packageId}/scans`);

// Additional Queries
// export const apiGetScansByPackage = async (packageId) =>
//   apiClient.get(`/packages/${packageId}/scans`);

export const apiGetPackageByCode = async (code) => {
  return axios.get(`${API_BASE}/packages/code/${code}`);
};

export const apiGetScansByPackage = async (packageId) => {
  return axios.get(`${API_BASE}/scans?filter=${JSON.stringify({ package: packageId })}`);
};

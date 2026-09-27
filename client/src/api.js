import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api"
});

export const getListings = (params = {}) =>
  api.get("/listings", { params }).then((res) => res.data);

export const createListing = (payload) =>
  api.post("/listings", payload).then((res) => res.data);

export const updateListing = (id, payload) =>
  api.put(`/listings/${id}`, payload).then((res) => res.data);

export const deleteListing = (id) =>
  api.delete(`/listings/${id}`).then((res) => res.data);

export const createReservation = (payload) =>
  api.post("/reservations", payload).then((res) => res.data);

export const getReservations = () =>
  api.get("/reservations").then((res) => res.data);

export const updateReservationStatus = (id, status) =>
  api.put(`/reservations/${id}/status`, { status }).then((res) => res.data);

export const getBusinessDashboard = (businessId = 1) =>
  api.get("/business/dashboard", { params: { businessId } }).then((res) => res.data);

export const getRecommendations = (businessId = 1) =>
  api.get("/business/recommendations", { params: { businessId } }).then((res) => res.data);

export default api;

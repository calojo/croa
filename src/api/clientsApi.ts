import api from "./axios";
import type { Client, ClientPayload } from "../types/client";

export const fetchClients = () =>
  api.get<Client[]>("/clients/").then((r) => r.data);

export const fetchClientById = (id: number) =>
  api.get<Client>(`/clients/${id}`).then((r) => r.data);

export const postClient = (data: ClientPayload) =>
  api.post<Client>("/clients/create_client_clients", data).then((r) => r.data);

export const putClient = (id: number, data: ClientPayload) =>
  api.put<Client>(`/clients/${id}`, data).then((r) => r.data);

export const deleteClientApi = (id: number) =>
  api.delete(`/clients/${id}`).then((r) => r.data);
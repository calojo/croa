import {
  fetchClients,
  fetchClientById,
  postClient,
  putClient,
  deleteClientApi,
} from "../api/clientsApi";
import { useAuthStore } from "../store/authStore";
import type { Client, ClientPayload } from "../types/client";

const getUserContext = () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Usuario no autenticado");
  return { company_id: user.company_id, branch_id: user.branch_id };
};

export const getClients = (): Promise<Client[]> =>
  fetchClients();

export const getClientById = (id: number): Promise<Client> =>
  fetchClientById(id);

export const createClient = (data: ClientPayload): Promise<Client> =>
  postClient({ ...data, ...getUserContext() });

export const updateClient = (id: number, data: ClientPayload): Promise<Client> =>
  putClient(id, { ...data, ...getUserContext() });

export const deleteClient = (id: number): Promise<void> =>
  deleteClientApi(id);
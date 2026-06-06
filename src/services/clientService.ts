import {
  fetchClients,
  fetchClientById,
  postClient,
  putClient,
  deleteClientApi,
} from "../api/clientsApi";

import { useAuthStore } from "../store/authStore";
import type { Client, ClientPayload } from "../types/client";

// Helper para limpiar strings vacíos a null
const clean = (data: ClientPayload): ClientPayload => ({
  ...data,
  email:   data.email?.trim()   || null,
  phone:   data.phone?.trim()   || null,
  address: data.address?.trim() || null,
  tax_id:  data.tax_id?.trim()  || null,
  notes:   data.notes?.trim()   || null,
});


const getUserContext = () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Usuario no autenticado");
  return { company_id: user.company_id, branch_id: user.branch_id };
};

export const getClients = (): Promise<Client[]> =>
  fetchClients();

export const getClientById = (id: number): Promise<Client> =>
  fetchClientById(id);

//export const createClient = (data: ClientPayload): Promise<Client> =>
 // postClient({ ...data, ...getUserContext() });
export const createClient = (data: ClientPayload): Promise<Client> => {
  const { company_id, branch_id } = getUserContext();

  const payload = clean({
    ...data,
    company_id,
    branch_id,
  });

  return postClient(payload);
};

export const updateClient = (id: number, data: ClientPayload): Promise<Client> =>
  putClient(id, { ...clean(data), ...getUserContext() });

export const deleteClient = (id: number): Promise<void> =>
  deleteClientApi(id);
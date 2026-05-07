import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import usePermissions from "../../../hooks/usePermissions";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../../services/clientService";
import type { Client, ClientPayload } from "../../../types/client";
import { useAuthStore} from "../../../store/authStore"; // ajusta el path


// ─── Constantes ────────────────────────────────────────────────────────────────
const ROUTE = "/maintenance/clients";




const ClientsPagef = () => {
  const { canView, canCreate, canEdit, canDelete, canExport } = usePermissions(ROUTE);
  
  // 👇 Temporal para debug
  const menu = useAuthStore((state) => state.menu);
  console.log("MENU EN STORE:", menu);
  console.log("ROUTE buscada:", ROUTE);
  console.log("canView:", canView);
}




const EMPTY_FORM: ClientPayload = {
  name: "",
  email: "",
  phone: "",
  address: "",
  credit_limit: 0,
  balance: 0,
  status: "Activo",
  type_person: "",
  tax_id: "",
  notes: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const exportToCSV = (clients: Client[]) => {
  const headers = [
    "Nombre","Email","Teléfono","Tipo","RNC/Cédula",
    "Límite Crédito","Balance","Estado",
  ];
  const rows = clients.map((c) => [
    c.name, c.email, c.phone, c.type_person, c.tax_id,
    c.credit_limit, c.balance, c.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clientes.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Tipos internos ────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof ClientPayload, string>>;

// ─── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ value }: { value: string }) => {
  const styles: Record<string, string> = {
    Activo:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Inactivo: "bg-gray-100 text-gray-500 border border-gray-200",
    Fisica:   "bg-blue-50 text-blue-700 border border-blue-200",
    Juridica: "bg-violet-50 text-violet-700 border border-violet-200",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[value] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      {value}
    </span>
  );
};

// ─── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputCls = (error?: string) =>
  `w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
   transition ${error ? "border-red-400" : "border-gray-200"}`;

// ─── Drawer ────────────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: ClientPayload) => Promise<void>;
  initial: Client | null;
  canEdit: boolean;
  canCreate: boolean;
}

const ClientDrawer = ({
  open,
  onClose,
  onSave,
  initial,
  canEdit,
  canCreate,
}: DrawerProps) => {
  const [form, setForm] = useState<ClientPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const isEditing = !!initial;

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        initial
          ? {
              name: initial.name,
              email: initial.email,
              phone: initial.phone,
              address: initial.address,
              credit_limit: initial.credit_limit,
              balance: initial.balance,
              status: initial.status,
              type_person: initial.type_person,
              tax_id: initial.tax_id,
              notes: initial.notes,
            }
          : EMPTY_FORM
      );
    }
  }, [open, initial]);

  const set = <K extends keyof ClientPayload>(field: K, value: ClientPayload[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.type_person) e.type_person = "Selecciona el tipo de persona";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Email inválido";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  const canSave = isEditing ? canEdit : canCreate;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Información general */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Información general
            </p>
            <div className="space-y-3">
              <Field label="Nombre completo *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Empresa XYZ S.R.L."
                  className={inputCls(errors.name)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de persona *" error={errors.type_person}>
                  <select
                    value={form.type_person}
                    onChange={(e) => set("type_person", e.target.value)}
                    className={inputCls(errors.type_person)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Fisica">Física</option>
                    <option value="Juridica">Jurídica</option>
                  </select>
                </Field>

                <Field label="Estado">
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className={inputCls()}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </Field>
              </div>

              <Field label="RNC / Cédula">
                <input
                  type="text"
                  value={form.tax_id}
                  onChange={(e) => set("tax_id", e.target.value)}
                  placeholder="000-0000000-0"
                  className={inputCls()}
                />
              </Field>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Contacto
            </p>
            <div className="space-y-3">
              <Field label="Correo electrónico" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="cliente@empresa.com"
                  className={inputCls(errors.email)}
                />
              </Field>

              <Field label="Teléfono">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(809) 000-0000"
                  className={inputCls()}
                />
              </Field>

              <Field label="Dirección">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Calle, ciudad, provincia"
                  className={inputCls()}
                />
              </Field>
            </div>
          </section>

          {/* Financiero */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Financiero
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Límite de crédito">
                <input
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) => set("credit_limit", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  className={inputCls()}
                />
              </Field>

              <Field label="Balance">
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) => set("balance", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  className={inputCls()}
                />
              </Field>
            </div>
          </section>

          {/* Notas */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Notas
            </p>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales..."
              className={`${inputCls()} resize-none`}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          {canSave && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium"
            >
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar cliente"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Confirm dialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const ConfirmDialog = ({
  open,
  name,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Eliminar cliente</p>
            <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          ¿Estás seguro que deseas eliminar a{" "}
          <span className="font-semibold text-gray-900">{name}</span>?
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors font-medium"
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Página principal ──────────────────────────────────────────────────────────
const ClientsPage = () => {
  const { canView, canCreate, canEdit, canDelete, canExport } =
    usePermissions(ROUTE);

  const [clients, setClients]           = useState<Client[]>([]);
  const [filtered, setFiltered]         = useState<Client[]>([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [search, setSearch]             = useState("");
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [delLoading, setDelLoading]     = useState(false);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await getClients();
      setClients(data);
      setFiltered(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar clientes");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.tax_id ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, clients]);

  const openCreate = () => {
    setEditTarget(null);
    setDrawerOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditTarget(client);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (form: ClientPayload) => {
    try {
      if (editTarget) {
        await updateClient(editTarget.id, form);
        toast.success("Cliente actualizado correctamente");
      } else {
        await createClient(form);
        toast.success("Cliente creado correctamente");
      }
      closeDrawer();
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar cliente");
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDelLoading(true);
    try {
      await deleteClient(deleteTarget.id);
      toast.success("Cliente eliminado");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar cliente");
    } finally {
      setDelLoading(false);
    }
  };

  // Sin permiso de vista
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No tienes permiso para ver este módulo.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length}{" "}
            {filtered.length === 1 ? "cliente" : "clientes"} encontrados
          </p>
        </div>

        <div className="flex gap-2">
          {canExport && (
            <button
              onClick={() => exportToCSV(filtered)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar
            </button>
          )}

          {canCreate && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo cliente
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7 7 0 104.65 16.65 7 7 0 0016.65 16.65z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o RNC/cédula..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loadingData ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Cargando clientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 3.13a4 4 0 010 7.75M12 14a4 4 0 110-8 4 4 0 010 8z"
              />
            </svg>
            No se encontraron clientes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">RNC / Cédula</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Límite crédito</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={c.type_person} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {c.tax_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">
                      RD$ {fmt(c.credit_limit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">
                      RD$ {fmt(c.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={c.status} />
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ClientDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onSave={handleSave}
        initial={editTarget}
        canCreate={canCreate}
        canEdit={canEdit}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={delLoading}
      />
    </div>
  );
};

export default ClientsPage;

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import usePermissions from "../../../hooks/usePermissions";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../../services/suppliersService";
import type { Supplier, SupplierFormData } from "../../../types/supplier";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROUTE = "/maintenance/suppliers";
              
const EMPTY_FORM: SupplierFormData = {
  name: "",
  description: "",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof SupplierFormData, string>>;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const exportToCSV = (suppliers: Supplier[]) => {
  const headers = ["ID", "Nombre", "Descripción"];
  const rows = suppliers.map((s) => [
    s.id,
    s.name,
    s.description,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "proveedores.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
const SupplierAvatar = ({
  name

}: {
  name: string;

}) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");



  return (
    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-blue-600">{initials}</span>
    </div>
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
  onSave: (form: SupplierFormData) => Promise<void>;
  initial: Supplier | null;
  canEdit: boolean;
  canCreate: boolean;
}

const SupplierDrawer = ({
  open,
  onClose,
  onSave,
  initial,
  canEdit,
  canCreate,
}: DrawerProps) => {
  const [form, setForm] = useState<SupplierFormData>(EMPTY_FORM);
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
              description: initial.description,
            }
          : EMPTY_FORM
      );
    }
  }, [open, initial]);

  const set = <K extends keyof SupplierFormData>(
    field: K,
    value: SupplierFormData[K]
  ) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.description.trim()) e.description = "La descripción es obligatoria";
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
            {isEditing ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
              <Field label="Nombre del proveedor *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Distribuidora Nacional S.R.L."
                  className={inputCls(errors.name)}
                />
              </Field>

              <Field label="Descripción *" error={errors.description}>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Breve descripción del proveedor, productos o servicios que ofrece..."
                  className={`${inputCls(errors.description)} resize-none`}
                />
              </Field>
            </div>
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
              {loading
                ? "Guardando..."
                : isEditing
                ? "Actualizar"
                : "Guardar proveedor"}
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
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Eliminar proveedor
            </p>
            <p className="text-xs text-gray-500">
              Esta acción no se puede deshacer
            </p>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
const SuppliersPage = () => {
  const { canView, canCreate, canEdit, canDelete, canExport } =
    usePermissions(ROUTE);

  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [filtered, setFiltered]         = useState<Supplier[]>([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [search, setSearch]             = useState("");
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [delLoading, setDelLoading]     = useState(false);

  // ── Load suppliers ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      setFiltered(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar proveedores");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Search filter ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, suppliers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setDrawerOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditTarget(supplier);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (form: SupplierFormData) => {
    try {
      if (editTarget) {
        await updateSupplier(editTarget.id, form);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await createSupplier(form);
        toast.success("Proveedor creado correctamente");
      }
      closeDrawer();
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar proveedor");
      throw e; // re-throw so the drawer knows it failed
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDelLoading(true);
    try {
      await deleteSupplier(deleteTarget.id);
      toast.success("Proveedor eliminado");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar proveedor");
    } finally {
      setDelLoading(false);
    }
  };

  // ── No permission ──────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No tienes permiso para ver este módulo.
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length}{" "}
            {filtered.length === 1 ? "proveedor" : "proveedores"} encontrados
          </p>
        </div>

        <div className="flex gap-2">
          {canExport && (
            <button
              onClick={() => exportToCSV(filtered)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo proveedor
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7 7 0 104.65 16.65 7 7 0 0016.65 16.65z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loadingData ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Cargando proveedores...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            No se encontraron proveedores
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {s.name}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                      <p className="truncate">{s.description || "—"}</p>
                    </td>

                    {/* Actions */}
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() =>{
                                console.log("delete target", s) 
                              setDeleteTarget(s)}
                              }
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
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
      <SupplierDrawer
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

export default SuppliersPage;

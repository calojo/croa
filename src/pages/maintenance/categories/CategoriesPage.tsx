import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import usePermissions from "../../../hooks/usePermissions";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/categoryservice";
import type { Category, CategoryPayload, CategoryUpdatePayload } from "../../../types/category";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROUTE = "/maintenance/categories";

const EMPTY_FORM: CategoryPayload = {
  name: "",
  description: "",
  image_url: "",
  company_id: 0, // This will be overridden in the service with the actual company_id from user context
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const exportToCSV = (categories: Category[]) => {
  const headers = ["ID", "Nombre", "Descripción", "Fecha creación"];
  const rows = categories.map((c) => [c.id, c.name, c.description, c.created_date]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "categorias.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Internal types ────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof CategoryPayload, string>>;

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

// ─── Image Upload Area ─────────────────────────────────────────────────────────
interface ImageUploadProps {
  currentUrl: string;
  file: File | null;
  preview: string;
  onChange: (file: File, preview: string) => void;
  onClear: () => void;
}

const ImageUploadArea = ({ currentUrl, file, preview, onChange, onClear }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const displaySrc = preview || currentUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB");
      return;
    }
    const objectUrl = URL.createObjectURL(selected);
    onChange(selected, objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (!dropped.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    const objectUrl = URL.createObjectURL(dropped);
    onChange(dropped, objectUrl);
  };

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">Imagen</label>

      {displaySrc ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-40 bg-gray-50">
          <img
            src={preview ? displaySrc : `${import.meta.env.VITE_API_URL}${displaySrc}`}
            alt="Categoría"
            className="w-full h-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 text-xs bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Quitar
            </button>
          </div>
          {file && (
            <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              Nueva imagen
            </span>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-center">
            <span className="text-blue-600 font-medium">Selecciona una imagen</span>
            <br />o arrastra aquí · máx. 5 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

// ─── Drawer ────────────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: CategoryPayload | CategoryUpdatePayload, file: File | null) => Promise<void>;
  initial: Category | null;
  canEdit: boolean;
  canCreate: boolean;
}

const CategoryDrawer = ({
  open,
  onClose,
  onSave,
  initial,
  canEdit,
  canCreate,
}: DrawerProps) => {
  const [form, setForm] = useState<CategoryPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const isEditing = !!initial;

  useEffect(() => {
    if (open) {
      setErrors({});
      setImageFile(null);
      setImagePreview("");
      setForm(
        initial
          ? {
              name: initial.name,
              description: initial.description,
              image_url: initial.image_url,
              company_id: initial.company_id,
            }
          : EMPTY_FORM
      );
    }
    // Cleanup object URLs on close
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = <K extends keyof CategoryPayload>(field: K, value: CategoryPayload[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
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
      await onSave(form, imageFile);
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
            {isEditing ? "Editar categoría" : "Nueva categoría"}
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
          {/* Image */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Imagen de categoría
            </p>
            <ImageUploadArea
              currentUrl={form.image_url}
              file={imageFile}
              preview={imagePreview}
              onChange={(f, prev) => {
                setImageFile(f);
                setImagePreview(prev);
              }}
              onClear={() => {
                setImageFile(null);
                setImagePreview("");
                set("image_url", "");
              }}
            />
          </section>

          {/* General info */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Información general
            </p>
            <div className="space-y-3">
              <Field label="Nombre *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Electrónica"
                  className={inputCls(errors.name)}
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Descripción de la categoría..."
                  className={`${inputCls()} resize-none`}
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
                : "Guardar categoría"}
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

const ConfirmDialog = ({ open, name, onConfirm, onCancel, loading }: ConfirmDialogProps) => {
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
            <p className="text-sm font-semibold text-gray-900">Eliminar categoría</p>
            <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          ¿Estás seguro que deseas eliminar{" "}
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

// ─── Category card (image thumbnail) ──────────────────────────────────────────
const CategoryImagePlaceholder = () => (
  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </div>
);

// ─── Main page ─────────────────────────────────────────────────────────────────
const CategoriesPage = () => {
  const { canView, canCreate, canEdit, canDelete, canExport } =
    usePermissions(ROUTE);

  const [categories, setCategories]     = useState<Category[]>([]);
  const [filtered, setFiltered]         = useState<Category[]>([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [search, setSearch]             = useState("");
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [delLoading, setDelLoading]     = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await getCategories();
      setCategories(data);
      setFiltered(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar categorías");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Client-side filter ───────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, categories]);

  // ── Drawer helpers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setDrawerOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTarget(null);
  };

  // ── Save (create or update + optional image upload) ──────────────────────────
  // The service handles the full flow:
  //   1. create/update record
  //   2. upload image (multipart) → get url back
  //   3. PUT image_url onto the record
  const handleSave = async (
    form: CategoryPayload | CategoryUpdatePayload,
    file: File | null
  ) => {
    try {
      if (editTarget) {
        await updateCategory(editTarget.id, form as CategoryUpdatePayload, file);
        toast.success("Categoría actualizada correctamente");
      } else {
        await createCategory(form as CategoryPayload, file);
        toast.success("Categoría creada correctamente");
      }

      closeDrawer();
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar categoría");
      throw e;
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDelLoading(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast.success("Categoría eliminada");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar categoría");
    } finally {
      setDelLoading(false);
    }
  };

  // ── No permission ────────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No tienes permiso para ver este módulo.
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length}{" "}
            {filtered.length === 1 ? "categoría" : "categorías"} encontradas
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
              Nueva categoría
            </button>
          )}
        </div>
      </div>

      {/* Search */}
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
          placeholder="Buscar por nombre o descripción..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loadingData ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Cargando categorías...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            No se encontraron categorías
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha creación
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    {/* Name + thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image_url ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${cat.image_url}`}
                            alt={cat.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <CategoryImagePlaceholder />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{cat.name}</p>
                          <p className="text-xs text-gray-400">ID: {cat.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <p className="line-clamp-2 text-sm leading-snug">
                        {cat.description || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(cat.created_date)}
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(cat)}
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
                              onClick={() => setDeleteTarget(cat)}
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
      <CategoryDrawer
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

export default CategoriesPage;

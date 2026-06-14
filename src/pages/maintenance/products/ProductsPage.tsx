import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import usePermissions from "../../../hooks/usePermissions";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStock,
} from "../../../services/productService";
import { getCategories } from "../../../services/categoryservice";
import { getSuppliers } from "../../../services/suppliersService";
import type { Product, ProductPayload, ProductUpdatePayload, ProductStock } from "../../../types/product";
import type { Category } from "../../../types/category";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROUTE = "/maintenance/products";

const EMPTY_FORM: ProductPayload = {
  sku: "",
  name: "",
  brand: "",
  description: "",
  barcode: "",
  cost: 0,
  price: 0,
  tax: 0,
  image_url: "",
  allow_negative_stock: false,
  min_margin: 0,
  main_store_id: 0,
  company_id: 0,
  branch_id: 0,
  category_id: 0,
  supplier_id: 0,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number | string) =>
  Number(n ?? 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const exportToCSV = (products: Product[]) => {
  const headers = [
    "ID", "SKU", "Nombre", "Marca", "Código de barras",
    "Costo", "Precio", "ITBIS %", "Margen mínimo %",
    "Categoría ID", "Proveedor ID", "Fecha creación",
  ];
  const rows = products.map((p) => [
    p.id, p.sku, p.name, p.brand, p.barcode,
    p.cost, p.price, p.tax, p.min_margin,
    p.category_id, p.supplier_id, p.created_date,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "productos.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Internal types ────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof ProductPayload, string>>;

// ─── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
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
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }
    const objectUrl = URL.createObjectURL(selected);
    onChange(selected, objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped || !dropped.type.startsWith("image/")) {
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
            alt="Producto"
            className="w-full h-full object-cover"
          />
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
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

// ─── Stock Modal ───────────────────────────────────────────────────────────────
interface StockModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

const StockModal = ({ open, product, onClose }: StockModalProps) => {
  const [stockList, setStockList] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    setLoading(true);
    getProductStock(product.id)
      .then(setStockList)
      .catch(() => toast.error("Error al cargar el stock"))
      .finally(() => setLoading(false));
  }, [open, product]);

  if (!open || !product) return null;

  const mainStock = stockList.find((s) => s.store_id === product.main_store_id);
  const otherStocks = stockList.filter((s) => s.store_id !== product.main_store_id);

  const stockBadge = (qty: string) => {
    const n = parseFloat(qty);
    if (n <= 0) return "bg-red-50 text-red-700 border border-red-200";
    if (n < 10) return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Stock del producto</p>
            <p className="text-xs text-gray-400 mt-0.5">{product.name} · SKU: {product.sku}</p>
          </div>
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
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Cargando stock...
            </div>
          ) : stockList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Sin registros de stock
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main store */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Almacén principal (Store {product.main_store_id})
                </p>
                {mainStock ? (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Cantidad</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${stockBadge(mainStock.quantity)}`}>
                          {fmt(mainStock.quantity)}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Reservado</p>
                        <p className="text-sm font-medium text-gray-700">{fmt(mainStock.reserved_quantity)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Disponible</p>
                        <p className="text-sm font-medium text-gray-700">{fmt(mainStock.available_quantity)}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Costo prom.</p>
                        <p className="text-xs font-medium text-gray-700">RD$ {fmt(mainStock.average_cost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Último costo</p>
                        <p className="text-xs font-medium text-gray-700">RD$ {fmt(mainStock.last_cost)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic px-1">
                    Sin stock registrado en el almacén principal
                  </p>
                )}
              </div>

              {/* Other stores */}
              {otherStocks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Otros almacenes
                  </p>
                  <div className="space-y-2">
                    {otherStocks.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                          <p className="text-xs font-medium text-gray-700">Store {s.store_id}</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-[10px] text-gray-400">Disponible</p>
                            <p className="text-xs font-medium text-gray-700">{fmt(s.available_quantity)}</p>
                          </div>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${stockBadge(s.quantity)}`}>
                            {fmt(s.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Drawer ────────────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: ProductPayload | ProductUpdatePayload, file: File | null) => Promise<void>;
  initial: Product | null;
  canEdit: boolean;
  canCreate: boolean;
  categories: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
}

const ProductDrawer = ({
  open,
  onClose,
  onSave,
  initial,
  canEdit,
  canCreate,
  categories,
  suppliers,
}: DrawerProps) => {
  const [form, setForm] = useState<ProductPayload>(EMPTY_FORM);
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
              sku: initial.sku,
              name: initial.name,
              brand: initial.brand,
              description: initial.description,
              barcode: initial.barcode,
              cost: initial.cost,
              price: initial.price,
              tax: initial.tax,
              image_url: initial.image_url,
              allow_negative_stock: initial.allow_negative_stock,
              min_margin: initial.min_margin,
              main_store_id: initial.main_store_id,
              company_id: initial.company_id,
              branch_id: initial.branch_id,
              category_id: initial.category_id,
              supplier_id: initial.supplier_id,
            }
          : EMPTY_FORM
      );
    }
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = <K extends keyof ProductPayload>(field: K, value: ProductPayload[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.sku.trim()) e.sku = "El SKU es obligatorio";
    if (form.price <= 0) e.price = "El precio debe ser mayor a 0";
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

      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? "Editar producto" : "Nuevo producto"}
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Image */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Imagen del producto
            </p>
            <ImageUploadArea
              currentUrl={form.image_url}
              file={imageFile}
              preview={imagePreview}
              onChange={(f, prev) => { setImageFile(f); setImagePreview(prev); }}
              onClear={() => { setImageFile(null); setImagePreview(""); set("image_url", ""); }}
            />
          </section>

          {/* Identificación */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Identificación
            </p>
            <div className="space-y-3">
              <Field label="Nombre *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Laptop HP 15 Core i5"
                  className={inputCls(errors.name)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU *" error={errors.sku}>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value)}
                    placeholder="Ej: HP-LAP-001"
                    className={inputCls(errors.sku)}
                  />
                </Field>
                <Field label="Código de barras">
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => set("barcode", e.target.value)}
                    placeholder="0000000000000"
                    className={inputCls()}
                  />
                </Field>
              </div>

              <Field label="Marca">
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="Ej: HP, Samsung, Apple"
                  className={inputCls()}
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Descripción del producto..."
                  className={`${inputCls()} resize-none`}
                />
              </Field>
            </div>
          </section>

          {/* Clasificación */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Clasificación
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoría">
                <select
                  value={form.category_id}
                  onChange={(e) => set("category_id", Number(e.target.value))}
                  className={inputCls()}
                >
                  <option value={0}>Seleccionar</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Proveedor">
                <select
                  value={form.supplier_id}
                  onChange={(e) => set("supplier_id", Number(e.target.value))}
                  className={inputCls()}
                >
                  <option value={0}>Seleccionar</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Precios */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Precios
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Costo (RD$)">
                <input
                  type="number"
                  value={form.cost}
                  onChange={(e) => set("cost", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={inputCls()}
                />
              </Field>
              <Field label="Precio (RD$)" error={errors.price}>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={inputCls(errors.price)}
                />
              </Field>
              <Field label="ITBIS (%)">
                <input
                  type="number"
                  value={form.tax}
                  onChange={(e) => set("tax", parseFloat(e.target.value) || 0)}
                  placeholder="18"
                  step="0.01"
                  min="0"
                  className={inputCls()}
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Margen mínimo (%)">
                <input
                  type="number"
                  value={form.min_margin}
                  onChange={(e) => set("min_margin", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={inputCls()}
                />
              </Field>
            </div>
          </section>

          {/* Inventario */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Inventario
            </p>
            <div className="space-y-3">
              <Field label="Almacén principal (Store ID)">
                <input
                  type="number"
                  value={form.main_store_id}
                  onChange={(e) => set("main_store_id", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className={inputCls()}
                />
              </Field>

              {/* Allow negative stock toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Permitir stock negativo</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Permite vender aunque no haya existencias
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("allow_negative_stock", !form.allow_negative_stock)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    form.allow_negative_stock ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.allow_negative_stock ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
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
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar producto"}
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
            <p className="text-sm font-semibold text-gray-900">Eliminar producto</p>
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

// ─── Image placeholder ─────────────────────────────────────────────────────────
const ProductImagePlaceholder = () => (
  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </div>
);

// ─── Main page ─────────────────────────────────────────────────────────────────

const ProductsPage = () => {
  
const { canView, canCreate, canEdit, canDelete, canExport } = usePermissions(ROUTE);

const [products, setProducts]         = useState<Product[]>([]);
const [filtered, setFiltered]         = useState<Product[]>([]);
const [loadingData, setLoadingData]   = useState(true);
const [search, setSearch]             = useState("");
const [drawerOpen, setDrawerOpen]     = useState(false);
const [editTarget, setEditTarget]     = useState<Product | null>(null);
const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
const [delLoading, setDelLoading]     = useState(false);
const [stockTarget, setStockTarget]   = useState<Product | null>(null);

// Lookup lists for the drawer selects
const [categories, setCategories] = useState<Category[]>([]);
const [suppliers, setSuppliers]   = useState<{ id: number; name: string }[]>([]);

// ── Load data ────────────────────────────────────────────────────────────────
const load = useCallback(async () => {
  setLoadingData(true);
  try {
    const [productsData, categoriesData, suppliersData] = await Promise.all([
      getProducts(),
      getCategories(),
      getSuppliers(),
    ]);
    setProducts(productsData);
    setFiltered(productsData);
    setCategories(categoriesData);
    setSuppliers(suppliersData);
  } catch (e: any) {
    toast.error(e?.message ?? "Error al cargar productos");
  } finally {
    setLoadingData(false);
  }
}, []);

useEffect(() => { load(); }, [load]);

// ── Client-side filter ───────────────────────────────────────────────────────
useEffect(() => {
  const q = search.toLowerCase();
  setFiltered(
    products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q)
    )
  );
}, [search, products]);

// ── Drawer helpers ───────────────────────────────────────────────────────────
const openCreate = () => { setEditTarget(null); setDrawerOpen(true); };
const openEdit   = (p: Product) => { setEditTarget(p); setDrawerOpen(true); };
const closeDrawer = () => { setDrawerOpen(false); setEditTarget(null); };

// ── Save ─────────────────────────────────────────────────────────────────────
const handleSave = async (
  form: ProductPayload | ProductUpdatePayload,
  file: File | null
) => {
  try {
    if (editTarget) {
      await updateProduct(editTarget.id, form as ProductUpdatePayload, file);
      toast.success("Producto actualizado correctamente");
    } else {
      await createProduct(form as ProductPayload, file);
      toast.success("Producto creado correctamente");
    }
    closeDrawer();
    load();
  } catch (e: any) {
    toast.error(e?.message ?? "Error al guardar producto");
    throw e;
  }
};

// ── Delete ───────────────────────────────────────────────────────────────────
const handleDelete = async () => {
  if (!deleteTarget) return;
  setDelLoading(true);
  try {
    await deleteProduct(deleteTarget.id);
    toast.success("Producto eliminado");
    setDeleteTarget(null);
    load();
  } catch (e: any) {
    toast.error(e?.message ?? "Error al eliminar producto");
  } finally {
    setDelLoading(false);
  }
};

// Helper: category name lookup
const categoryName = (id: number) =>
  categories.find((c) => c.id === id)?.name ?? "—";

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
        <h1 className="text-xl font-semibold text-gray-900">Productos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {filtered.length}{" "}
          {filtered.length === 1 ? "producto" : "productos"} encontrados
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
            Nuevo producto
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
        placeholder="Buscar por nombre, SKU, código de barras o marca..."
        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Table */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {loadingData ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Cargando productos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          No se encontraron productos
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ITBIS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creación</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {/* Product name + thumbnail */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${p.image_url}`}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ProductImagePlaceholder />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand || "—"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {p.sku || "—"}
                  </td>

                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {categoryName(p.category_id)}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">
                    RD$ {fmt(p.cost)}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-gray-900">
                    RD$ {fmt(p.price)}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                    {fmt(p.tax)}%
                  </td>

                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(p.created_date)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Stock button — always visible */}
                      <button
                        onClick={() => setStockTarget(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Ver stock"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => openEdit(p)}
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
                          onClick={() => setDeleteTarget(p)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Drawer */}
    <ProductDrawer
      open={drawerOpen}
      onClose={closeDrawer}
      onSave={handleSave}
      initial={editTarget}
      canCreate={canCreate}
      canEdit={canEdit}
      categories={categories}
      suppliers={suppliers}
    />

    {/* Stock modal */}
    <StockModal
      open={!!stockTarget}
      product={stockTarget}
      onClose={() => setStockTarget(null)}
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


export default ProductsPage;

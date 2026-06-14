import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import usePermissions from "../../hooks/usePermissions";
import { getClients } from "../../services/clientService";
import { getProducts } from "../../services/productService";
import { getActiveTaxReceipts } from "../../services/taxReceiptsService";
import { getCompany } from "../../services/companyService";
import { createSale, getSaleById, calcLine, calcTotals } from "../../services/saleService";
import type { Client } from "../../types/client";
import type { Product } from "../../types/product";
import type { TaxReceipt } from "../../types/taxReceipt";
import type { Company } from "../../types/company";
import type { Sale, SaleLine } from "../../types/sale";
import { useAuthStore } from "../../store/authStore";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROUTE = "/sales/new";
const GENERIC_CLIENT_ID = 0;
const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "RD$ " +
  Number(n ?? 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const padId = (id: number) => String(id).padStart(8, "0");

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
    <label className="block text-xs text-gray-500 mb-1 font-medium">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const inputCls = (error?: string) =>
  `w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
   transition ${error ? "border-red-400" : "border-gray-200"}`;

// ─── Autocomplete component ────────────────────────────────────────────────────
interface AutocompleteProps<T> {
  placeholder: string;
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  disabled?: boolean;
}

function Autocomplete<T>({
  placeholder,
  items,
  filterFn,
  renderItem,
  onSelect,
  disabled,
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? items.filter((i) => filterFn(i, query))
    : items.slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        className={inputCls()}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((item, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(item)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Saving overlay ────────────────────────────────────────────────────────────
const SavingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 gap-4">
    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    <span className="text-white text-sm font-medium">{message}</span>
  </div>
);

// ─── Receipt component (renders printable content) ─────────────────────────────
interface ReceiptProps {
  sale: Sale;
  company: Company | null;
  lines: SaleLine[];
  payAmount: number;
  onClose: () => void;
}

const Receipt = ({ sale, company, lines, payAmount, onClose }: ReceiptProps) => {
  const change = Math.max(0, payAmount - sale.total_value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-80 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-900">Recibo de venta</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar recibo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — printable area */}
        <div id="receipt-print-area" className="flex-1 overflow-y-auto px-4 py-3 text-xs font-mono leading-relaxed">
          {/* Company info */}
          <div className="text-center mb-3">
            <p className="text-sm font-semibold">{company?.business_name ?? "—"}</p>
            {company?.rnc && <p className="text-gray-500">RNC: {company.rnc}</p>}
            {company?.email && <p className="text-gray-500">{company.email}</p>}
            {company?.phone && <p className="text-gray-500">{company.phone}</p>}
          </div>

          <hr className="border-dashed border-gray-300 my-2" />

          {/* Sale metadata */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Factura N°</span>
              <span className="font-medium">{padId(sale.id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha</span>
              <span>{new Date(sale.created_date).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="capitalize">{sale.sale_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pago</span>
              <span>{sale.payment_method}</span>
            </div>
            {sale.tax_receipt_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">NCF</span>
                <span className="font-medium">{sale.tax_receipt_number}</span>
              </div>
            )}
          </div>

          <hr className="border-dashed border-gray-300 my-2" />

          {/* Line items */}
          <div className="space-y-1">
            {sale.details.map((d, i) => {
              const uiLine = lines.find((l) => l.product_id === d.product_id && i === lines.findIndex((ll) => ll.product_id === d.product_id));
              const displayName = d.product_id === 0 ? (d.note || "Producto genérico") : (uiLine?.name ?? `Producto #${d.product_id}`);
              const discPct = uiLine?.disc_pct ?? 0;
              const unitItbis = uiLine?.unit_itbis ?? 0;
              const calc = uiLine ? calcLine(uiLine) : null;
              return (
                <div key={i} className="mb-2">
                  <p className="font-medium truncate">{displayName}</p>
                  <div className="flex justify-between text-gray-500">
                    <span>{d.quantity} × {fmt(d.price)}</span>
                    <span>{fmt(d.quantity * d.price)}</span>
                  </div>
                  {discPct > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desc. {discPct}%</span>
                      <span>– {fmt(calc?.disc_amt ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>ITBIS</span>
                    <span>{fmt(calc?.itbis ?? unitItbis * d.quantity)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span></span>
                    <span>{fmt(d.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="border-dashed border-gray-300 my-2" />

          {/* Totals */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{fmt(sale.gross_value)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento</span><span>– {fmt(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>ITBIS</span><span>{fmt(sale.tax_value)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-300 pt-1 mt-1">
              <span>TOTAL</span><span>{fmt(sale.total_value)}</span>
            </div>
            {sale.payment_method === "Efectivo" && sale.sale_type === "contado" && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Recibido</span><span>{fmt(payAmount)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Cambio</span><span>{fmt(change)}</span>
                </div>
              </>
            )}
          </div>

          <hr className="border-dashed border-gray-300 my-2" />
          <p className="text-center text-gray-400">¡Gracias por su compra!</p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pay modal ─────────────────────────────────────────────────────────────────
interface PayModalProps {
  total: number;
  saleType: "contado" | "credito";
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onConfirm: (payAmount: number) => void;
  onClose: () => void;
}

const PayModal = ({
  total,
  saleType,
  paymentMethod,
  onPaymentMethodChange,
  onConfirm,
  onClose,
}: PayModalProps) => {
  const [payAmount, setPayAmount] = useState<string>("");
  const [error, setError] = useState("");

  const isEfectivo = paymentMethod === "Efectivo" && saleType === "contado";
  const paid = parseFloat(payAmount) || 0;
  const change = Math.max(0, paid - total);

  const handleConfirm = () => {
    if (isEfectivo && paid < total) {
      setError("El monto recibido debe ser mayor o igual al total de la factura.");
      return;
    }
    onConfirm(isEfectivo ? paid : total);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Procesar cobro</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <Field label="Método de pago">
            <select
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
              className={inputCls()}
            >
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>

          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total de la factura</p>
            <div className="px-3 py-2.5 bg-gray-50 rounded-lg text-base font-semibold text-center text-gray-900">
              {fmt(total)}
            </div>
          </div>

          {isEfectivo && (
            <Field label="Monto recibido" error={error}>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => { setPayAmount(e.target.value); setError(""); }}
                placeholder="0.00"
                step="0.01"
                className={inputCls(error)}
                autoFocus
              />
            </Field>
          )}

          {isEfectivo && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Cambio a devolver</p>
              <p className={`text-2xl font-semibold ${change >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmt(change)}
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmar y guardar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const SalesPage = () => {
  const { canView, canCreate } = usePermissions(ROUTE);
  const { user } = useAuthStore();

  // ── Catalog data ─────────────────────────────────────────────────────────────
  const [clients, setClients]         = useState<Client[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [taxReceipts, setTaxReceipts] = useState<TaxReceipt[]>([]);
  const [company, setCompany]         = useState<Company | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // ── Invoice state ─────────────────────────────────────────────────────────────
  const [lines, setLines]               = useState<SaleLine[]>([]);
  const [saleType, setSaleType]         = useState<"contado" | "credito">("contado");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<TaxReceipt | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Efectivo");
  const [notes, setNotes]               = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [payModalOpen, setPayModalOpen]   = useState(false);
  const [savingMsg, setSavingMsg]         = useState<string | null>(null);
  const [savedSale, setSavedSale]         = useState<Sale | null>(null);
  const [savedPayAmount, setSavedPayAmount] = useState(0);
  const [clientError, setClientError]     = useState("");

  // ── Load catalogs ─────────────────────────────────────────────────────────────
  const loadCatalogs = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [c, p, tr, co] = await Promise.all([
        getClients(),
        getProducts(),
        getActiveTaxReceipts(),
        getCompany(),
      ]);
      // Prepend generic client
      const genericClient: Client = {
        id: GENERIC_CLIENT_ID,
        name: "Cliente genérico",
        phone: "",
        email: "",
        address: "",
        credit_limit: 0,
        balance: 0,
        status: "Activo",
        type_person: "",
        tax_id: "",
        notes: "",
        company_id: 0,
        branch_id: 0,
      };
      setClients([genericClient, ...c]);
      setProducts(p);
      setTaxReceipts(tr);
      setCompany(co);
      setSelectedClient(genericClient);
    } catch (e: any) {
      toast.error(e?.detail ?? "Error al cargar catálogos");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => { loadCatalogs(); }, [loadCatalogs]);

  // ── Line management ───────────────────────────────────────────────────────────
  const addProductLine = (product: Product) => {
    setLines((prev) => [
      ...prev,
      {
        _uid: Date.now(),
        product_id: product.id,
        name: product.name,
        code: product.sku ?? String(product.barcode),
        qty: 1,
        price: product.price ?? 0,
        unit_itbis: product.tax ?? 0,
        disc_pct: 0,
        generic: false,
        note: "",
      },
    ]);
  };

  const addGenericLine = () => {
    setLines((prev) => [
      ...prev,
      {
        _uid: Date.now(),
        product_id: 0,
        name: "Producto genérico",
        code: "GEN",
        qty: 1,
        price: 0,
        unit_itbis: 0,
        disc_pct: 0,
        generic: true,
        note: "",
      },
    ]);
  };

  const removeLine = (uid: number) =>
    setLines((prev) => prev.filter((l) => l._uid !== uid));

  const updateLine = (uid: number, field: keyof SaleLine, value: unknown) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l._uid !== uid) return l;
        if (field === "qty") return { ...l, qty: Math.max(1, Number(value) || 1) };
        if (field === "disc_pct") return { ...l, disc_pct: Math.min(100, Math.max(0, Number(value) || 0)) };
        if (field === "note") return { ...l, note: String(value) };
        return l;
      })
    );
  };

  // ── Totals ────────────────────────────────────────────────────────────────────
  const totals = calcTotals(lines);

  // ── NCF builder ───────────────────────────────────────────────────────────────
  const ncf = selectedReceipt
    ? selectedReceipt.tax_number + String(selectedReceipt.secuence).padStart(8, "0")
    : null;

  // ── Validation before opening pay modal ───────────────────────────────────────
  const handleOpenPayModal = () => {
    if (lines.length === 0) { toast.error("Agrega al menos un producto a la factura."); return; }
    if (lines.some((l) => l.generic && !l.note.trim())) {
      toast.error("Los productos genéricos requieren una nota obligatoria.");
      return;
    }
    if (saleType === "credito" && (!selectedClient || selectedClient.id === GENERIC_CLIENT_ID)) {
      setClientError("Selecciona un cliente para ventas a crédito.");
      return;
    }
    setClientError("");
    setPayModalOpen(true);
  };

  // ── Submit sale ───────────────────────────────────────────────────────────────
  const handleConfirmSale = async (payAmount: number) => {
    setPayModalOpen(false);
    setSavingMsg("Guardando factura...");
    try {
      const created = await createSale({
        lines,
        saleType,
        clientId: selectedClient?.id ?? GENERIC_CLIENT_ID,
        paymentMethod,
        payAmount,
        notes,
        taxReceipt: selectedReceipt,
        companyId: user?.company_id ?? 0,
        branchId: user?.branch_id ?? 0,
        userId: user?.user_id ?? 0,
      });

      setSavingMsg("Leyendo factura guardada...");
      const full = await getSaleById(created.id);
      setSavedPayAmount(payAmount);
      setSavedSale(full);
      toast.success(`Factura #${padId(full.id)} creada correctamente`);
    } catch (e: any) {
      toast.error(e?.detail ?? "Error al guardar la factura");
    } finally {
      setSavingMsg(null);
    }
  };

  // ── Reset after receipt closed ────────────────────────────────────────────────
  const handleCloseReceipt = () => {
    setSavedSale(null);
    setLines([]);
    setNotes("");
    setSelectedReceipt(null);
    setSaleType("contado");
    setPaymentMethod("Efectivo");
    setSelectedClient(clients[0] ?? null);
  };

  // ── No permission ─────────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No tienes permiso para ver este módulo.
      </div>
    );
  }

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* Loading catalogs */}
      {loadingCatalog ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Cargando catálogos...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">

          {/* ── LEFT: product search + line table ─────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Nueva factura
              </h2>
              <span className="text-xs text-gray-400">Factura #——</span>
            </div>

            {/* Product search bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
                <div className="pl-9">
                  <Autocomplete<Product>
                    placeholder="Buscar producto por nombre o código..."
                    items={products}
                    filterFn={(p, q) =>
                      p.name.toLowerCase().includes(q.toLowerCase()) ||
                      (p.sku ?? p.barcode).toLowerCase().includes(q.toLowerCase())
                    }
                    renderItem={(p) => (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku ?? p.barcode} · {fmt(p.price ?? 0)} + ITBIS {fmt(p.tax ?? 0)}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                    onSelect={addProductLine}
                  />
                </div>
              </div>
              <button
                onClick={addGenericLine}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Genérico
              </button>
            </div>

            {/* Lines */}
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
                Sin productos — busca uno o agrega uno genérico
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "25%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "4%" }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Producto", "Cant.", "Precio", "Desc. %", "ITBIS", "Total", "Nota", ""].map((h, i) => (
                          <th key={i} className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 1 && i <= 5 ? "text-right" : "text-left"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lines.map((line) => {
                        const c = calcLine(line);
                        const noteError = line.generic && !line.note.trim();
                        return (
                          <tr key={line._uid} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900 truncate text-xs">
                                {line.generic && (
                                  <span className="inline-block text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mr-1">GEN</span>
                                )}
                                {line.name}
                              </p>
                              <p className="text-[11px] text-gray-400">{line.code}</p>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={line.qty}
                                min={1}
                                step={1}
                                onChange={(e) => updateLine(line._uid, "qty", e.target.value)}
                                className="w-full px-2 py-1 text-xs text-right border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-mono text-gray-700">
                              {fmt(line.price)}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={line.disc_pct}
                                min={0}
                                max={100}
                                step={1}
                                onChange={(e) => updateLine(line._uid, "disc_pct", e.target.value)}
                                className="w-full px-2 py-1 text-xs text-right border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-mono text-gray-500">
                              {fmt(c.itbis)}
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-mono font-semibold text-gray-900">
                              {fmt(c.total)}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={line.note}
                                onChange={(e) => updateLine(line._uid, "note", e.target.value)}
                                placeholder={line.generic ? "⚠ Requerida" : "Opcional"}
                                className={`w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
                                  noteError ? "border-red-400 bg-red-50" : "border-gray-200"
                                }`}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => removeLine(line._uid)}
                                aria-label="Eliminar línea"
                                className="p-1 rounded text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button onClick={addGenericLine} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors w-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar producto genérico
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: sale config + totals ──────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Sale type + client + receipt + payment */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Configuración</h3>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Sale type toggle */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">Tipo de venta</p>
                  <div className="grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setSaleType("contado")}
                      className={`py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5
                        ${saleType === "contado"
                          ? "bg-green-50 text-green-700 border-r border-green-200"
                          : "text-gray-500 hover:bg-gray-50 border-r border-gray-200"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Contado
                    </button>
                    <button
                      onClick={() => setSaleType("credito")}
                      className={`py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5
                        ${saleType === "credito"
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Crédito
                    </button>
                  </div>
                </div>

                {/* Client search */}
                <div className="px-4 py-3 space-y-2">
                  <Field label="Cliente" error={clientError}>
                    <Autocomplete<Client>
                      placeholder="Buscar por nombre o teléfono..."
                      items={clients}
                      filterFn={(c, q) =>
                        c.name.toLowerCase().includes(q.toLowerCase()) ||
                        (c.phone ?? "").includes(q)
                      }
                      renderItem={(c) => (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                        </div>
                      )}
                      onSelect={(c) => { setSelectedClient(c); setClientError(""); }}
                    />
                  </Field>
                  {selectedClient && (
                    <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-blue-800">{selectedClient.name}</p>
                        {selectedClient.phone && <p className="text-[11px] text-blue-600">{selectedClient.phone}</p>}
                      </div>
                      <button
                        onClick={() => setSelectedClient(clients[0] ?? null)}
                        className="text-blue-400 hover:text-blue-700 text-xs ml-2"
                        aria-label="Quitar cliente seleccionado"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Tax receipt */}
                <div className="px-4 py-3 space-y-2">
                  <Field label="Tipo de comprobante">
                    <select
                      value={selectedReceipt?.id ?? 0}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedReceipt(taxReceipts.find((t) => t.id === id) ?? null);
                      }}
                      className={inputCls()}
                    >
                      <option value={0}>Ninguno</option>
                      {taxReceipts.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tax_number} — {t.description} (seq: {t.secuence})
                        </option>
                      ))}
                    </select>
                  </Field>
                  {selectedReceipt && ncf && (
                    <div className="text-xs text-gray-500">
                      NCF: <span className="font-mono font-medium text-gray-800">{ncf}</span>
                    </div>
                  )}
                </div>

                {/* Payment method */}
                <div className="px-4 py-3">
                  <Field label="Método de pago">
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={inputCls()}>
                      {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Notes */}
                <div className="px-4 py-3">
                  <Field label="Notas">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observaciones opcionales..."
                      className={inputCls()}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Totals + action */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Resumen</h3>
              </div>
              <div className="px-4 py-3 space-y-2">
                {[
                  { label: "Subtotal",  value: fmt(totals.gross) },
                  { label: "Descuento", value: `– ${fmt(totals.disc)}`, cls: "text-red-600" },
                  { label: "Neto",      value: fmt(totals.net) },
                  { label: "ITBIS",     value: fmt(totals.tax) },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={cls ?? "text-gray-700"}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Total a cobrar</span>
                  <span className="text-base font-bold text-blue-700">{fmt(totals.total)}</span>
                </div>
              </div>
              <div className="px-4 pb-4">
                {canCreate ? (
                  <button
                    onClick={handleOpenPayModal}
                    disabled={lines.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cobrar factura
                  </button>
                ) : (
                  <p className="text-xs text-center text-gray-400">Sin permiso para crear ventas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay modal ──────────────────────────────────────────────────────────── */}
      {payModalOpen && (
        <PayModal
          total={totals.total}
          saleType={saleType}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onConfirm={handleConfirmSale}
          onClose={() => setPayModalOpen(false)}
        />
      )}

      {/* ── Saving overlay ────────────────────────────────────────────────────── */}
      {savingMsg && <SavingOverlay message={savingMsg} />}

      {/* ── Receipt ───────────────────────────────────────────────────────────── */}
      {savedSale && (
        <Receipt
          sale={savedSale}
          company={company}
          lines={lines}
          payAmount={savedPayAmount}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
};

export default SalesPage;

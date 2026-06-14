import { apiCreateSale, apiGetSaleById } from "../api/apiSale";
import { buildNcf, isTaxReceiptValid } from "./taxReceiptsService";
import type { Sale, SalePayload, SaleLine, SaleLineCalc } from "../types/sale";
import type { TaxReceipt } from "../types/taxReceipt";

// ─── Line math ─────────────────────────────────────────────────────────────────

export const calcLine = (line: SaleLine): SaleLineCalc => {
  const gross = line.qty * line.price;
  const disc_amt = gross * (line.disc_pct / 100);
  const net = gross - disc_amt;
  const itbis = line.unit_itbis * line.qty * (1 - line.disc_pct / 100);
  const total = net + itbis;
  return { gross, disc_amt, net, itbis, total };
};

export const calcTotals = (lines: SaleLine[]) => {
  let gross = 0, disc = 0, net = 0, tax = 0, total = 0;
  for (const l of lines) {
    const c = calcLine(l);
    gross += c.gross;
    disc  += c.disc_amt;
    net   += c.net;
    tax   += c.itbis;
    total += c.total;
  }
  return { gross, disc, net, tax, total };
};

// ─── Create sale ───────────────────────────────────────────────────────────────

interface CreateSaleOptions {
  lines: SaleLine[];
  saleType: "contado" | "credito";
  clientId: number;
  paymentMethod: string;
  payAmount: number;
  notes: string;
  taxReceipt: TaxReceipt | null;
  /** company_id / branch_id / user_id come from auth store */
  companyId: number;
  branchId: number;
  userId: number;
}

export const createSale = async (opts: CreateSaleOptions): Promise<Sale> => {
  const { gross, disc, net, tax, total } = calcTotals(opts.lines);

  // Validate tax receipt sequence before submitting
  if (opts.taxReceipt && !isTaxReceiptValid(opts.taxReceipt)) {
    throw new Error("El comprobante fiscal seleccionado ha superado su secuencia máxima.");
  }

  const taxReceiptId = opts.taxReceipt?.id ?? 0;
  const taxReceiptNumber = opts.taxReceipt ? buildNcf(opts.taxReceipt) : "";

  const changeAmount = opts.saleType === "contado"
    ? Math.max(0, opts.payAmount - total)
    : 0;

  const payload: SalePayload = {
    pay_amount:         opts.saleType === "contado" ? opts.payAmount : 0,
    change_amount:      changeAmount,
    gross_value:        parseFloat(gross.toFixed(2)),
    discount:           parseFloat(disc.toFixed(2)),
    net_value:          parseFloat(net.toFixed(2)),
    tax_value:          parseFloat(tax.toFixed(2)),
    total_value:        parseFloat(total.toFixed(2)),
    payment_method:     opts.paymentMethod,
    sale_type:          opts.saleType,
    status:             opts.saleType === "credito" ? "open" : "closed",
    notes:              opts.notes,
    tax_receipt_id:     taxReceiptId,
    tax_receipt_number: taxReceiptNumber,
    company_id:         opts.companyId,
    branch_id:          opts.branchId,
    user_id:            opts.userId,
    client_id:          opts.clientId,
    details: opts.lines.map((l) => {
      const c = calcLine(l);
      return {
        quantity:   l.qty,
        price:      l.price,
        discount:   parseFloat(c.disc_amt.toFixed(2)),
        total:      parseFloat(c.total.toFixed(2)),
        product_id: l.product_id,
        sale_id:    0,          // backend fills this after insert
        note:       l.note,
      };
    }),
  };

  return apiCreateSale(payload);
};

// ─── Fetch saved sale (used to build the receipt after saving) ─────────────────

export const getSaleById = async (id: number): Promise<Sale> => {
  return apiGetSaleById(id);
};

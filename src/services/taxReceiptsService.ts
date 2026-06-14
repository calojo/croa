import { apiGetTaxReceipts } from "../api/apiTaxReceipts";
import type { TaxReceipt } from "../types/taxReceipt";

// ─── Tax Receipts Service ──────────────────────────────────────────────────────

export const getActiveTaxReceipts = async (): Promise<TaxReceipt[]> => {
  const all = await apiGetTaxReceipts();
  return all.filter((t) => t.status === "Active");
};

/**
 * Validates that the current sequence is within the valid range.
 * Returns true if the receipt can still be used.
 */
export const isTaxReceiptValid = (receipt: TaxReceipt): boolean => {
  return (
    receipt.secuence >= receipt.secuence_from &&
    receipt.secuence <= receipt.secuence_to
  );
};

/**
 * Builds the NCF string from tax_number + zero-padded secuence (no dashes).
 * Example: "1010" + seq 5 → "10100000005"
 */
export const buildNcf = (receipt: TaxReceipt): string => {
  return receipt.tax_number + String(receipt.secuence).padStart(8, "0");
};

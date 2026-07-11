/**
 * Eganow bank paypartner code → display name.
 * Source: Eganow Bank Payout docs (Supported Banks). The Paypartner Search API
 * returns codes only (no names), so we map them here for the picker.
 */
export const BANK_NAMES: Record<string, string> = {
  GCBGH: 'GCB Bank Limited',
  SOCIETE: 'Societe Generale Ghana',
  ARBAPEX: 'ARB Apex Bank Limited',
  OMNIBSIC: 'OmniBSIC Bank',
  FIRSTATGH: 'First Atlantic Bank',
  FBNGH: 'First Bank of Nigeria',
  BANKOFAFRICA: 'Bank of Africa',
  FIDELITY: 'Fidelity Bank Limited',
  FNBGH: 'First National Bank',
  CBG: 'Consolidated Bank Ghana',
  ACCESSGH: 'Access Bank Ltd',
  UNAFBKGH: 'United Bank of Africa',
  GTBANKGH: 'Guaranty Trust Bank',
  PBL: 'Prudential Bank Ltd',
  CAL: 'CAL Bank Limited',
  ECOBANKGH: 'Ecobank Ghana Limited',
  ZENITHGH: 'Zenith Bank Ghana Ltd',
  REPUBLIC: 'Republic Bank Limited',
  UMB: 'Universal Merchant Bank',
  ADB: 'Agricultural Development Bank',
  NIB: 'National Investment Bank',
  ABSA: 'Absa Bank Ghana Limited',
  STANCHART: 'Standard Chartered Bank',
  STANBICGH: 'Stanbic Bank',
}

/** Human-readable name for a bank code (falls back to the code). */
export function bankName(code: string): string {
  return BANK_NAMES[code] ?? code
}

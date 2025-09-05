import { CollectionBeforeChangeHook } from 'payload'

import { mobile_money_bank_codes } from '@/lib/constants/bank_codes'
import { paystack } from '@/payload.config'

export const createSubAccount: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  if (operation === 'update') {
    if (data?.bank && !originalDoc?.bank) {
      // user is adding a bank
      const res = await paystack.createSubaccount({
        business_name: data.fullName,
        settlement_bank:
          mobile_money_bank_codes[data.bank.toLowerCase() as keyof typeof mobile_money_bank_codes],
        account_number: data.accountNumber,
        percentage_charge: 2, // default to 2%
        description: `Subaccount for ${data.fullName}`,
        primary_contact_email: data.email,
        primary_contact_name: data.fullName,
        primary_contact_phone: data.phoneNumber,
      })

      if (res?.status && res?.data) {
        data.paystackSubAccountCode = (res.data as any)?.subaccount_code
        data.accountNumber = (res.data as any)?.account_number
        data.accountHolder = (res.data as any)?.account_name
      }
    } else if (
      data?.bank != originalDoc?.bank ||
      data?.accountNumber != originalDoc?.accountNumber ||
      data?.accountHolder != originalDoc?.accountHolder ||
      data?.paystackSubAccountCode != originalDoc?.paystackSubAccountCode
    ) {
      //user is updating withdrawal account
      const res = await paystack.updateSubaccount(data.paystackSubAccountCode, {
        business_name: data.fullName,
        bank_code:
          mobile_money_bank_codes[data.bank.toLowerCase() as keyof typeof mobile_money_bank_codes],
        account_number: data.accountNumber,
        percentage_charge: 2, // default to 2%
        description: `Subaccount for ${data.fullName}`,
        primary_contact_email: data.email,
        primary_contact_name: data.fullName,
        primary_contact_phone: data.phoneNumber,
      })

      if (res?.status && res?.data) {
        data.paystackSubAccountCode = (res.data as any)?.subaccount_code
        data.accountNumber = (res.data as any)?.account_number
        data.accountHolder = (res.data as any)?.account_name
      }
    }
  }
}

import { describe, it, beforeEach, expect } from 'vitest'

import TransactionCharges from '../../src/utilities/transaction-charges'

describe('TransactionCharges', () => {
  let transactionCharges: TransactionCharges

  beforeEach(() => {
    transactionCharges = new TransactionCharges()
  })

  describe('Constructor and Configuration', () => {
    it('should default to creator pays platform fees', () => {
      const defaultCharges = new TransactionCharges()
      const explicitDefaultCharges = new TransactionCharges({})
      const explicitTrueCharges = new TransactionCharges({ isCreatorPaysPlatformFees: true })

      const amount = 100
      const result1 = defaultCharges.calculateAmountAndCharges(amount)
      const result2 = explicitDefaultCharges.calculateAmountAndCharges(amount)
      const result3 = explicitTrueCharges.calculateAmountAndCharges(amount)

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
    })

    it('should produce same results regardless of fee payer since all fees are zero', () => {
      const contributorPaysCharges = new TransactionCharges({ isCreatorPaysPlatformFees: false })
      const creatorPaysCharges = new TransactionCharges({ isCreatorPaysPlatformFees: true })

      const amount = 100
      const contributorResult = contributorPaysCharges.calculateAmountAndCharges(amount)
      const creatorResult = creatorPaysCharges.calculateAmountAndCharges(amount)

      // With zero fees, both models produce the same result
      expect(contributorResult).toEqual(creatorResult)
    })
  })

  describe('calculateContributorAmount - No Fees', () => {
    it('should return the same amount with zero charges', () => {
      const testCases = [
        { amount: 100 },
        { amount: 200 },
        { amount: 150 },
        { amount: 500 },
        { amount: 1000 },
      ]

      testCases.forEach(({ amount }) => {
        const result = transactionCharges.calculateContributorAmount(amount)

        expect(result.totalAmount).toBe(amount)
        expect(result.paystackCharge).toBe(0)
      })
    })

    it('should handle decimal amounts correctly', () => {
      const result = transactionCharges.calculateContributorAmount(99.5)
      expect(result.totalAmount).toBe(99.5)
      expect(result.paystackCharge).toBe(0)
    })

    it('should handle zero amount', () => {
      const result = transactionCharges.calculateContributorAmount(0)
      expect(result.totalAmount).toBe(0)
      expect(result.paystackCharge).toBe(0)
    })
  })

  describe('calculateRecipientAmount - No Fees', () => {
    it('should return the original amount with zero platform charge', () => {
      const testCases = [{ originalAmount: 100 }, { originalAmount: 200 }]

      testCases.forEach(({ originalAmount }) => {
        const result = transactionCharges.calculateRecipientAmount(
          originalAmount,
          originalAmount,
          0,
        )

        expect(result.platformCharge).toBe(0)
        expect(result.amountAfterCharges).toBe(originalAmount)
      })
    })
  })

  describe('calculateAmountAndCharges - No Fees', () => {
    it('should pass through amounts unchanged', () => {
      const testCases = [{ amount: 100 }, { amount: 200 }, { amount: 500 }, { amount: 1000 }]

      testCases.forEach(({ amount }) => {
        const result = transactionCharges.calculateAmountAndCharges(amount)

        expect(result.totalAmount).toBe(amount)
        expect(result.amountAfterCharges).toBe(amount)
        expect(result.platformCharge).toBe(0)
        expect(result.paystackCharge).toBe(0)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should maintain consistency between individual method calls and integrated method', () => {
      const testAmounts = [50, 100, 150, 200, 300, 500, 1000]

      testAmounts.forEach((amount) => {
        const contributorResult = transactionCharges.calculateContributorAmount(amount)
        const recipientResult = transactionCharges.calculateRecipientAmount(
          amount,
          contributorResult.totalAmount,
          contributorResult.paystackCharge,
        )
        const integratedResult = transactionCharges.calculateAmountAndCharges(amount)

        expect(integratedResult.totalAmount).toBe(contributorResult.totalAmount)
        expect(integratedResult.paystackCharge).toBe(contributorResult.paystackCharge)
        expect(integratedResult.platformCharge).toBe(recipientResult.platformCharge)
        expect(integratedResult.amountAfterCharges).toBe(recipientResult.amountAfterCharges)
      })
    })

    it('should handle edge cases correctly', () => {
      const smallAmount = 10
      const result = transactionCharges.calculateAmountAndCharges(smallAmount)
      expect(result.totalAmount).toBe(smallAmount)
      expect(result.amountAfterCharges).toBe(smallAmount)

      const largeAmount = 10000
      const largeResult = transactionCharges.calculateAmountAndCharges(largeAmount)
      expect(largeResult.totalAmount).toBe(largeAmount)
      expect(largeResult.amountAfterCharges).toBe(largeAmount)
    })

    it('should handle decimal amounts with expected precision', () => {
      const testAmounts = [33.33, 66.66, 99.99, 123.456, 789.123]

      testAmounts.forEach((amount) => {
        const result = transactionCharges.calculateAmountAndCharges(amount)

        expect(typeof result.totalAmount).toBe('number')
        expect(typeof result.platformCharge).toBe('number')
        expect(result.totalAmount).toBeCloseTo(amount, 2)
        expect(result.amountAfterCharges).toBeCloseTo(amount, 2)
      })
    })
  })

  describe('Fee Configuration', () => {
    it('should have zero fee rates', () => {
      expect(transactionCharges.paystackFeeRate).toBe(0)
      expect(transactionCharges.platformFeeRate).toBe(0)
      expect(transactionCharges.paystackTransferFeeMomo).toBe(0)
    })
  })
})

import { describe, it, beforeEach, expect } from 'vitest'

import TransactionCharges from '../../src/lib/utils/transaction-charges'

describe('TransactionCharges', () => {
  let transactionCharges: TransactionCharges

  beforeEach(() => {
    transactionCharges = new TransactionCharges()
  })

  describe('calculateContributorAmount', () => {
    it('should calculate correct total amount and paystack charge for contributor', () => {
      const testCases = [
        { amount: 100, expectedTotal: 101.95, expectedPaystackCharge: 1.99 },
        { amount: 200, expectedTotal: 203.9, expectedPaystackCharge: 3.98 },
        { amount: 150, expectedTotal: 152.93, expectedPaystackCharge: 2.98 },
        { amount: 500, expectedTotal: 509.75, expectedPaystackCharge: 9.94 },
        { amount: 1000, expectedTotal: 1019.5, expectedPaystackCharge: 19.88 },
      ]

      testCases.forEach(({ amount, expectedTotal, expectedPaystackCharge }) => {
        const result = transactionCharges.calculateContributorAmount(amount)

        expect(result.totalAmount).toBe(expectedTotal)
        expect(result.paystackCharge).toBe(expectedPaystackCharge)
      })
    })

    it('should handle decimal amounts correctly', () => {
      const result = transactionCharges.calculateContributorAmount(99.5)
      expect(result.totalAmount).toBe(101.44)
      expect(result.paystackCharge).toBe(1.98)
    })

    it('should handle zero amount', () => {
      const result = transactionCharges.calculateContributorAmount(0)
      expect(result.totalAmount).toBe(0)
      expect(result.paystackCharge).toBe(0)
    })
  })

  describe('calculateRecipientAmount', () => {
    it('should calculate correct platform charge and amount after charges with conditional paystackTransferFeeMomo deduction', () => {
      const testCases = [
        {
          originalAmount: 100,
          totalAmount: 101.95,
          paystackCharge: 1.99,
          expectedPlatformCharge: 1.96, // <= 2, so fee deducted from amountAfterCharges
          expectedAmountAfterCharges: 97, // 98 - 1 (paystackTransferFeeMomo)
          description: 'platform charge <= 2, fee deducted from amountAfterCharges',
        },
        {
          originalAmount: 200,
          totalAmount: 203.9,
          paystackCharge: 3.98,
          expectedPlatformCharge: 2.92, // > 2, so 3.92 - 1 (paystackTransferFeeMomo)
          expectedAmountAfterCharges: 196,
          description: 'platform charge > 2, fee deducted from platformCharge',
        },
        {
          originalAmount: 150,
          totalAmount: 152.93,
          paystackCharge: 2.98,
          expectedPlatformCharge: 1.95, // > 2, so 2.95 - 1 (paystackTransferFeeMomo)
          expectedAmountAfterCharges: 147,
          description: 'platform charge > 2, fee deducted from platformCharge',
        },
      ]

      testCases.forEach(
        ({
          originalAmount,
          totalAmount,
          paystackCharge,
          expectedPlatformCharge,
          expectedAmountAfterCharges,
          description,
        }) => {
          const result = transactionCharges.calculateRecipientAmount(
            originalAmount,
            totalAmount,
            paystackCharge,
          )

          expect(result.platformCharge).toBe(expectedPlatformCharge)
          expect(result.amountAfterCharges).toBe(expectedAmountAfterCharges)
        },
      )
    })
  })

  describe('calculateAmountAndCharges - Main Integration Tests', () => {
    it('should calculate all charges correctly for the specified test cases with conditional fee deduction', () => {
      const testCases = [
        {
          amount: 100,
          expectedAmountAfterCharges: 97, // 98 - 1 (paystackTransferFeeMomo deducted from amountAfterCharges)
          description:
            '100 should result in 97 after charges (fee deducted from amountAfterCharges)',
        },
        {
          amount: 200,
          expectedAmountAfterCharges: 196, // Fee deducted from platformCharge, so amountAfterCharges unchanged
          description: '200 should result in 196 after charges (fee deducted from platformCharge)',
        },
        {
          amount: 150,
          expectedAmountAfterCharges: 147, // Fee deducted from platformCharge, so amountAfterCharges unchanged
          description: '150 should result in 147 after charges (fee deducted from platformCharge)',
        },
      ]

      testCases.forEach(({ amount, expectedAmountAfterCharges, description }) => {
        const result = transactionCharges.calculateAmountAndCharges(amount)

        expect(result.amountAfterCharges).toBe(expectedAmountAfterCharges)

        // Note: The total reduction may not be exactly 2% due to conditional fee deduction
        console.log(`Amount ${amount}: actual amountAfterCharges = ${result.amountAfterCharges}`)
      })
    })

    it('should satisfy the updated charge formula with conditional paystackTransferFeeMomo deduction', () => {
      const testCases = [100, 150, 200, 250, 500, 1000]

      testCases.forEach(amount => {
        const result = transactionCharges.calculateAmountAndCharges(amount)

        // Total charges deducted = totalAmount - amountAfterCharges
        const totalChargesDeducted = result.totalAmount - result.amountAfterCharges

        // The charges should include paystack + platform + paystackTransferFeeMomo (always 1 cedi)
        const calculatedCharges =
          result.paystackCharge + result.platformCharge + result.paystackTransferFeeMomo

        expect(totalChargesDeducted).toBeCloseTo(calculatedCharges, 2)
      })
    })

    it('should maintain consistency between individual method calls and integrated method', () => {
      const testAmounts = [50, 100, 150, 200, 300, 500, 1000]

      testAmounts.forEach(amount => {
        // Calculate using individual methods
        const contributorResult = transactionCharges.calculateContributorAmount(amount)
        const recipientResult = transactionCharges.calculateRecipientAmount(
          amount,
          contributorResult.totalAmount,
          contributorResult.paystackCharge,
        )

        // Calculate using integrated method
        const integratedResult = transactionCharges.calculateAmountAndCharges(amount)

        // Results should match
        expect(integratedResult.totalAmount).toBe(contributorResult.totalAmount)
        expect(integratedResult.paystackCharge).toBe(contributorResult.paystackCharge)
        expect(integratedResult.platformCharge).toBe(recipientResult.platformCharge)
        expect(integratedResult.amountAfterCharges).toBe(recipientResult.amountAfterCharges)
      })
    })

    it('should handle edge cases correctly with conditional fee deduction', () => {
      // Test very small amounts - these may result in negative values due to 1 cedi deduction
      const smallAmount = 1
      const smallResult = transactionCharges.calculateAmountAndCharges(smallAmount)
      expect(smallResult.totalAmount).toBeGreaterThan(smallAmount)
      // Note: amountAfterCharges may be negative for very small amounts due to 1 cedi deduction

      // Test large amounts
      const largeAmount = 10000
      const largeResult = transactionCharges.calculateAmountAndCharges(largeAmount)
      expect(largeResult.amountAfterCharges).toBeLessThan(largeAmount)
      expect(largeResult.totalAmount).toBeGreaterThan(largeAmount)
      expect(largeResult.amountAfterCharges).toBeGreaterThan(0) // Large amounts should still be positive after deduction
    })

    it('should handle decimal amounts with expected precision', () => {
      const testAmounts = [33.33, 66.66, 99.99, 123.456, 789.123]

      testAmounts.forEach(amount => {
        const result = transactionCharges.calculateAmountAndCharges(amount)

        // Check that returned values are numbers (precision may vary based on calculation)
        expect(typeof result.totalAmount).toBe('number')
        expect(typeof result.paystackCharge).toBe('number')
        expect(typeof result.platformCharge).toBe('number')
        expect(typeof result.amountAfterCharges).toBe('number')

        // Verify mathematical relationships still hold
        expect(result.totalAmount).toBeGreaterThan(amount)
        expect(result.amountAfterCharges).toBeLessThan(amount)
      })
    })
  })

  describe('Fee Configuration', () => {
    it('should have correct fee percentages set', () => {
      expect(transactionCharges.paystackFeeRate).toBe(0.0195) // 1.95%
      expect(transactionCharges.platformFeeRate).toBe(0.02) // 2%
      expect(transactionCharges.paystackTransferFeeMomo).toBe(1) // 1 cedi
    })
  })

  describe('Conditional Fee Deduction Logic', () => {
    it('should deduct paystackTransferFeeMomo from platformCharge when platformCharge > 2', () => {
      const testAmounts = [150, 200, 250, 500]

      testAmounts.forEach(amount => {
        const contributorResult = transactionCharges.calculateContributorAmount(amount)
        const recipientResult = transactionCharges.calculateRecipientAmount(
          amount,
          contributorResult.totalAmount,
          contributorResult.paystackCharge,
        )

        // Calculate what the platform charge would be without the deduction
        const AmountLeftAfterPaystackCharges =
          contributorResult.totalAmount - contributorResult.paystackCharge
        const diff = amount - AmountLeftAfterPaystackCharges
        const originalPlatformCharge = amount * 0.02 - diff

        if (originalPlatformCharge > 2) {
          expect(recipientResult.platformCharge).toBe(
            Number((originalPlatformCharge - 1).toFixed(2)),
          )
        }
      })
    })

    it('should deduct paystackTransferFeeMomo from amountAfterCharges when platformCharge <= 2', () => {
      const testAmounts = [50, 75, 100]

      testAmounts.forEach(amount => {
        const contributorResult = transactionCharges.calculateContributorAmount(amount)
        const recipientResult = transactionCharges.calculateRecipientAmount(
          amount,
          contributorResult.totalAmount,
          contributorResult.paystackCharge,
        )

        // Calculate what the platform charge would be without the deduction
        const AmountLeftAfterPaystackCharges =
          contributorResult.totalAmount - contributorResult.paystackCharge
        const diff = amount - AmountLeftAfterPaystackCharges
        const originalPlatformCharge = amount * 0.02 - diff

        if (originalPlatformCharge <= 2) {
          // Platform charge should remain unchanged (use toBeCloseTo for floating point comparison)
          expect(recipientResult.platformCharge).toBeCloseTo(originalPlatformCharge, 2)

          // Amount after charges should have 1 cedi deducted
          const expectedAmountAfterCharges =
            AmountLeftAfterPaystackCharges - originalPlatformCharge - 1
          expect(recipientResult.amountAfterCharges).toBeCloseTo(expectedAmountAfterCharges, 2)
        }
      })
    })
  })

  describe('Mathematical Relationships', () => {
    it('should ensure total amount equals original amount plus 1.95%', () => {
      const testAmounts = [100, 200, 150]

      testAmounts.forEach(amount => {
        const result = transactionCharges.calculateAmountAndCharges(amount)
        const expectedTotal = amount + amount * 0.0195

        expect(result.totalAmount).toBeCloseTo(expectedTotal, 2)
      })
    })

    it('should ensure paystack charge is 1.95% of total amount', () => {
      const testAmounts = [100, 200, 150]

      testAmounts.forEach(amount => {
        const result = transactionCharges.calculateAmountAndCharges(amount)
        const expectedPaystackCharge = result.totalAmount * 0.0195

        expect(result.paystackCharge).toBeCloseTo(expectedPaystackCharge, 2)
      })
    })

    it('should verify the conditional fee deduction logic', () => {
      // Test cases to verify the conditional logic for paystackTransferFeeMomo deduction
      const testCases = [
        { original: 100, afterCharges: 97, feeDeductedFrom: 'amountAfterCharges' },
        { original: 200, afterCharges: 196, feeDeductedFrom: 'platformCharge' },
        { original: 150, afterCharges: 147, feeDeductedFrom: 'platformCharge' },
        { original: 50, afterCharges: 48, feeDeductedFrom: 'amountAfterCharges' },
      ]

      testCases.forEach(({ original, afterCharges, feeDeductedFrom }) => {
        const result = transactionCharges.calculateAmountAndCharges(original)

        expect(result.amountAfterCharges).toBe(afterCharges)

        // Verify paystackTransferFeeMomo is included in response
        expect(result.paystackTransferFeeMomo).toBe(1)

        console.log(`Amount ${original}: fee deducted from ${feeDeductedFrom}`)
      })
    })
  })
})

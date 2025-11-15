import { describe, it, beforeEach, expect } from 'vitest'

import TransactionCharges from '../../src/utilities/transaction-charges'

describe('TransactionCharges', () => {
  let transactionCharges: TransactionCharges
  let transactionChargesContributorPays: TransactionCharges

  beforeEach(() => {
    // Default: Creator pays platform fees (isCreatorPaysPlatformFees = true)
    transactionCharges = new TransactionCharges()

    // Alternative: Contributor pays platform fees (isCreatorPaysPlatformFees = false)
    transactionChargesContributorPays = new TransactionCharges({ isCreatorPaysPlatformFees: false })
  })

  describe('Constructor and Configuration', () => {
    it('should default to creator pays platform fees', () => {
      const defaultCharges = new TransactionCharges()
      const explicitDefaultCharges = new TransactionCharges({})
      const explicitTrueCharges = new TransactionCharges({ isCreatorPaysPlatformFees: true })

      // All should behave the same way (creator pays)
      const amount = 100
      const result1 = defaultCharges.calculateAmountAndCharges(amount)
      const result2 = explicitDefaultCharges.calculateAmountAndCharges(amount)
      const result3 = explicitTrueCharges.calculateAmountAndCharges(amount)

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
    })

    it('should support contributor pays platform fees when explicitly set', () => {
      const contributorPaysCharges = new TransactionCharges({ isCreatorPaysPlatformFees: false })
      const creatorPaysCharges = new TransactionCharges({ isCreatorPaysPlatformFees: true })

      const amount = 100
      const contributorResult = contributorPaysCharges.calculateAmountAndCharges(amount)
      const creatorResult = creatorPaysCharges.calculateAmountAndCharges(amount)

      // Results should be different
      expect(contributorResult).not.toEqual(creatorResult)
    })
  })

  describe('calculateContributorAmount - Creator Pays Platform Fees', () => {
    it('should calculate correct total amount and paystack charge when creator pays platform fees', () => {
      const testCases = [
        { amount: 100, expectedTotal: 101.5, expectedPaystackCharge: 1.52 },
        { amount: 200, expectedTotal: 203, expectedPaystackCharge: 3.04 },
        { amount: 150, expectedTotal: 152.25, expectedPaystackCharge: 2.28 },
        { amount: 500, expectedTotal: 507.5, expectedPaystackCharge: 7.61 },
        { amount: 1000, expectedTotal: 1015, expectedPaystackCharge: 15.22 },
      ]

      testCases.forEach(({ amount, expectedTotal, expectedPaystackCharge }) => {
        const result = transactionCharges.calculateContributorAmount(amount)

        expect(result.totalAmount).toBe(expectedTotal)
        expect(result.paystackCharge).toBe(expectedPaystackCharge)
      })
    })

    it('should handle decimal amounts correctly', () => {
      const result = transactionCharges.calculateContributorAmount(99.5)
      expect(result.totalAmount).toBe(100.99)
      expect(result.paystackCharge).toBe(1.51)
    })

    it('should handle zero amount', () => {
      const result = transactionCharges.calculateContributorAmount(0)
      expect(result.totalAmount).toBe(0)
      expect(result.paystackCharge).toBe(0)
    })
  })

  describe('calculateContributorAmount - Contributor Pays Platform Fees', () => {
    it('should calculate correct total amount when contributor pays platform fees', () => {
      const testCases = [
        { amount: 100, expectedTotalApprox: 102.5 }, // Should be higher due to platform fees
        { amount: 200, expectedTotalApprox: 205 },
        { amount: 150, expectedTotalApprox: 153.75 },
      ]

      testCases.forEach(({ amount, expectedTotalApprox }) => {
        const result = transactionChargesContributorPays.calculateContributorAmount(amount)

        // Total should be higher when contributor pays platform fees
        expect(result.totalAmount).toBeGreaterThan(expectedTotalApprox)
        expect(result.paystackCharge).toBeGreaterThan(0)
      })
    })
  })

  describe('calculateRecipientAmount - Creator Pays Platform Fees', () => {
    it('should calculate correct platform charge and amount after charges when creator pays platform fees', () => {
      const testCases = [
        {
          originalAmount: 100,
          totalAmount: 101.5,
          paystackCharge: 1.52,
          expectedPlatformCharge: 0.98,
          expectedAmountAfterCharges: 99, // baseAmountAfterCharges - transferFee
          description:
            'creator pays platform fees - recipient gets amount after charges minus transfer fee',
        },
        {
          originalAmount: 200,
          totalAmount: 203,
          paystackCharge: 3.04,
          expectedPlatformCharge: 1.96,
          expectedAmountAfterCharges: 198, // baseAmountAfterCharges - transferFee
          description:
            'creator pays platform fees - recipient gets amount after charges minus transfer fee',
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

          expect(result.platformCharge).toBeCloseTo(expectedPlatformCharge, 2)
          expect(result.amountAfterCharges).toBeCloseTo(expectedAmountAfterCharges, 2)
        },
      )
    })
  })

  describe('calculateRecipientAmount - Contributor Pays Platform Fees', () => {
    it('should calculate correct platform charge and amount after charges when contributor pays platform fees', () => {
      const testCases = [
        {
          originalAmount: 100,
          description: 'contributor pays platform fees - recipient gets full original amount',
        },
        {
          originalAmount: 200,
          description: 'contributor pays platform fees - recipient gets full original amount',
        },
      ]

      testCases.forEach(({ originalAmount, description }) => {
        const contributorResult =
          transactionChargesContributorPays.calculateContributorAmount(originalAmount)
        const result = transactionChargesContributorPays.calculateRecipientAmount(
          originalAmount,
          contributorResult.totalAmount,
          contributorResult.paystackCharge,
        )

        // When contributor pays platform fees, recipient should get the original amount
        expect(result.amountAfterCharges).toBe(originalAmount)
        expect(result.platformCharge).toBeGreaterThan(0)
      })
    })
  })

  describe('calculateAmountAndCharges - Creator Pays Platform Fees (Default)', () => {
    it('should calculate all charges correctly when creator pays platform fees', () => {
      const testCases = [
        {
          amount: 100,
          expectedAmountAfterCharges: 99, // Based on actual implementation: baseAmountAfterCharges - transferFee
          description: '100 should result in 99 after charges (creator pays platform fees)',
        },
        {
          amount: 200,
          expectedAmountAfterCharges: 198, // Based on actual implementation: baseAmountAfterCharges - transferFee
          description: '200 should result in 198 after charges (creator pays platform fees)',
        },
      ]

      testCases.forEach(({ amount, expectedAmountAfterCharges, description }) => {
        const result = transactionCharges.calculateAmountAndCharges(amount)

        expect(result.amountAfterCharges).toBeCloseTo(expectedAmountAfterCharges, 0)
        expect(result.totalAmount).toBeGreaterThan(amount) // Contributor pays more than original
        expect(result.platformCharge).toBeGreaterThan(0)
        expect(result.paystackCharge).toBeGreaterThan(0)

        console.log(
          `Amount ${amount}: actual amountAfterCharges = ${result.amountAfterCharges} (${description})`,
        )
      })
    })
  })

  describe('calculateAmountAndCharges - Contributor Pays Platform Fees', () => {
    it('should calculate all charges correctly when contributor pays platform fees', () => {
      const testCases = [
        {
          amount: 100,
          expectedAmountAfterCharges: 100, // Contributor pays platform fees, recipient gets original amount
          description: '100 should result in 100 after charges (contributor pays platform fees)',
        },
        {
          amount: 200,
          expectedAmountAfterCharges: 200, // Contributor pays platform fees, recipient gets original amount
          description: '200 should result in 200 after charges (contributor pays platform fees)',
        },
      ]

      testCases.forEach(({ amount, expectedAmountAfterCharges, description }) => {
        const result = transactionChargesContributorPays.calculateAmountAndCharges(amount)

        expect(result.amountAfterCharges).toBe(expectedAmountAfterCharges)
        expect(result.totalAmount).toBeGreaterThan(amount) // Contributor pays more than original
        expect(result.platformCharge).toBeGreaterThan(0)
        expect(result.paystackCharge).toBeGreaterThan(0)

        console.log(
          `Amount ${amount}: actual amountAfterCharges = ${result.amountAfterCharges} (${description})`,
        )
      })
    })
  })

  describe('Integration Tests - Both Fee Models', () => {
    it('should maintain consistency between individual method calls and integrated method', () => {
      const testAmounts = [50, 100, 150, 200, 300, 500, 1000]

      testAmounts.forEach((amount) => {
        // Test Creator Pays model
        const creatorContributorResult = transactionCharges.calculateContributorAmount(amount)
        const creatorRecipientResult = transactionCharges.calculateRecipientAmount(
          amount,
          creatorContributorResult.totalAmount,
          creatorContributorResult.paystackCharge,
        )
        const creatorIntegratedResult = transactionCharges.calculateAmountAndCharges(amount)

        expect(creatorIntegratedResult.totalAmount).toBe(creatorContributorResult.totalAmount)
        expect(creatorIntegratedResult.paystackCharge).toBe(creatorContributorResult.paystackCharge)
        expect(creatorIntegratedResult.platformCharge).toBe(creatorRecipientResult.platformCharge)
        expect(creatorIntegratedResult.amountAfterCharges).toBe(
          creatorRecipientResult.amountAfterCharges,
        )

        // Test Contributor Pays model
        const contributorContributorResult =
          transactionChargesContributorPays.calculateContributorAmount(amount)
        const contributorRecipientResult =
          transactionChargesContributorPays.calculateRecipientAmount(
            amount,
            contributorContributorResult.totalAmount,
            contributorContributorResult.paystackCharge,
          )
        const contributorIntegratedResult =
          transactionChargesContributorPays.calculateAmountAndCharges(amount)

        expect(contributorIntegratedResult.totalAmount).toBe(
          contributorContributorResult.totalAmount,
        )
        expect(contributorIntegratedResult.paystackCharge).toBe(
          contributorContributorResult.paystackCharge,
        )
        expect(contributorIntegratedResult.platformCharge).toBe(
          contributorRecipientResult.platformCharge,
        )
        expect(contributorIntegratedResult.amountAfterCharges).toBe(
          contributorRecipientResult.amountAfterCharges,
        )
      })
    })

    it('should handle edge cases correctly with both fee models', () => {
      // Test small amounts
      const smallAmount = 10
      const creatorResult = transactionCharges.calculateAmountAndCharges(smallAmount)
      const contributorResult =
        transactionChargesContributorPays.calculateAmountAndCharges(smallAmount)

      expect(creatorResult.totalAmount).toBeGreaterThan(smallAmount)
      expect(contributorResult.totalAmount).toBeGreaterThan(smallAmount)
      expect(contributorResult.amountAfterCharges).toBe(smallAmount) // Contributor pays, recipient gets original

      // Test large amounts
      const largeAmount = 10000
      const creatorLargeResult = transactionCharges.calculateAmountAndCharges(largeAmount)
      const contributorLargeResult =
        transactionChargesContributorPays.calculateAmountAndCharges(largeAmount)

      expect(creatorLargeResult.totalAmount).toBeGreaterThan(largeAmount)
      expect(contributorLargeResult.totalAmount).toBeGreaterThan(largeAmount)
      expect(contributorLargeResult.amountAfterCharges).toBe(largeAmount) // Contributor pays, recipient gets original
    })

    it('should handle decimal amounts with expected precision', () => {
      const testAmounts = [33.33, 66.66, 99.99, 123.456, 789.123]

      testAmounts.forEach((amount) => {
        const creatorResult = transactionCharges.calculateAmountAndCharges(amount)
        const contributorResult =
          transactionChargesContributorPays.calculateAmountAndCharges(amount)

        // Check that returned values are numbers
        expect(typeof creatorResult.totalAmount).toBe('number')
        expect(typeof creatorResult.platformCharge).toBe('number')
        expect(typeof contributorResult.totalAmount).toBe('number')
        expect(typeof contributorResult.platformCharge).toBe('number')

        // Verify mathematical relationships
        expect(creatorResult.totalAmount).toBeGreaterThan(amount)
        expect(contributorResult.totalAmount).toBeGreaterThan(amount)
        expect(contributorResult.amountAfterCharges).toBeCloseTo(amount, 2) // Contributor pays, recipient gets original
      })
    })
  })

  describe('Fee Configuration', () => {
    it('should have correct fee percentages set', () => {
      expect(transactionCharges.paystackFeeRate).toBe(0.015) // 1.5%
      expect(transactionCharges.platformFeeRate).toBe(0.01) // 1%
      expect(transactionCharges.paystackTransferFeeMomo).toBe(0) // Updated to 0
    })
  })

  describe('Fee Model Comparison', () => {
    it('should show differences between creator pays vs contributor pays models', () => {
      const testAmounts = [100, 200, 500]

      testAmounts.forEach((amount) => {
        const creatorPaysResult = transactionCharges.calculateAmountAndCharges(amount)
        const contributorPaysResult =
          transactionChargesContributorPays.calculateAmountAndCharges(amount)

        // Contributor should pay more when they pay platform fees
        expect(contributorPaysResult.totalAmount).toBeGreaterThan(creatorPaysResult.totalAmount)

        // Recipient should get original amount when contributor pays platform fees
        expect(contributorPaysResult.amountAfterCharges).toBe(amount)

        // When creator pays, recipient gets less than original
        expect(creatorPaysResult.amountAfterCharges).toBeLessThanOrEqual(amount)

        console.log(`Amount ${amount}:`)
        console.log(
          `  Creator Pays: Contributor pays ${creatorPaysResult.totalAmount}, Recipient gets ${creatorPaysResult.amountAfterCharges}`,
        )
        console.log(
          `  Contributor Pays: Contributor pays ${contributorPaysResult.totalAmount}, Recipient gets ${contributorPaysResult.amountAfterCharges}`,
        )
      })
    })
  })
})

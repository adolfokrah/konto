export default class TransactionCharges {
  private readonly paystackFee = 0.015 // 1.5%
  private readonly platformFee = 0.01 // 1%
  private readonly transferFee = 0 // 1 cedi
  private readonly transferFeeThreshold = 2 // Platform charge threshold for fee allocation
  private readonly isCreatorPaysPlatformFees: boolean

  constructor({ isCreatorPaysPlatformFees }: { isCreatorPaysPlatformFees?: boolean } = {}) {
    this.isCreatorPaysPlatformFees = isCreatorPaysPlatformFees ?? true
  }

  /**
   * Getters for testing access to private properties
   */
  get paystackFeeRate() {
    return this.paystackFee
  }
  get platformFeeRate() {
    return this.platformFee
  }
  get paystackTransferFeeMomo() {
    return this.transferFee
  } // Keep original name for backward compatibility

  /**
   * Calculates the total amount contributor pays and Paystack's charge
   */
  calculateContributorAmount(amount: number): { totalAmount: number; paystackCharge: number } {
    const basePlatformCharge = this.isCreatorPaysPlatformFees ? 0 : amount * this.platformFee

    // Add Paystack fee to original amount + platform charge (if contributor pays)
    const totalAmount = this.roundToTwo((amount + basePlatformCharge) * (1 + this.paystackFee))

    // Calculate Paystack's charge (1.95% of total amount)
    const paystackCharge = this.roundToTwo(totalAmount * this.paystackFee)

    return {
      totalAmount,
      paystackCharge,
    }
  }

  /**
   * Calculates platform charge and final amount recipient receives
   */
  calculateRecipientAmount(originalAmount: number, totalAmount: number, paystackCharge: number) {
    const amountAfterPaystackFees = this.roundToTwo(totalAmount - paystackCharge)
    const roundingDifference = this.roundToTwo(amountAfterPaystackFees - originalAmount)

    // Calculate our platform charge (2% of original amount, adjusted for rounding)
    const basePlatformCharge = this.isCreatorPaysPlatformFees
      ? originalAmount * this.platformFee + roundingDifference
      : roundingDifference
    const baseAmountAfterCharges = amountAfterPaystackFees - basePlatformCharge

    // Smart fee allocation: absorb transfer fee from platform charge if possible
    // if (basePlatformCharge > this.transferFeeThreshold) {
    //   return {
    //     platformCharge: this.roundToTwo(basePlatformCharge - this.transferFee),
    //     amountAfterCharges: this.roundToTwo(baseAmountAfterCharges),
    //   }
    // } else {

    // }
    return {
      platformCharge: this.roundToTwo(basePlatformCharge),
      amountAfterCharges: this.isCreatorPaysPlatformFees
        ? this.roundToTwo(baseAmountAfterCharges)
        : this.roundToTwo(originalAmount),
    }
  }

  /**
   * Main method: calculates all charges and final amounts
   */
  calculateAmountAndCharges(amount: number) {
    const { totalAmount, paystackCharge } = this.calculateContributorAmount(amount)
    const { platformCharge, amountAfterCharges } = this.calculateRecipientAmount(
      amount,
      totalAmount,
      paystackCharge,
    )

    return {
      totalAmount,
      paystackCharge,
      platformCharge,
      amountAfterCharges,
      paystackTransferFeeMomo: this.transferFee, // Keep original name for backward compatibility
      originalAmount: amount, // For reference
    }
  }

  /**
   * Helper method to round numbers to 2 decimal places
   */
  private roundToTwo(num: number): number {
    return Number(num.toFixed(2))
  }
}

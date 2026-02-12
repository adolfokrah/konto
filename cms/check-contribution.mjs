import payload from 'payload'
import dotenv from 'dotenv'

dotenv.config()

async function checkContribution() {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    local: true,
  })

  // Find recent ₵10 contribution
  const result = await payload.find({
    collection: 'transactions',
    where: {
      amountContributed: { equals: 10 },
      type: { equals: 'contribution' },
    },
    limit: 5,
    sort: '-createdAt',
  })

  console.log('Found contributions:', result.docs.length)
  result.docs.forEach((doc, i) => {
    console.log(`\n--- Contribution ${i + 1} ---`)
    console.log('ID:', doc.id)
    console.log('Amount:', doc.amountContributed)
    console.log('Payment Status:', doc.paymentStatus)
    console.log('Payment Method:', doc.paymentMethod)
    console.log('Is Settled:', doc.isSettled)
    console.log('Type:', doc.type)
    console.log('Created:', doc.createdAt)
  })

  process.exit(0)
}

checkContribution().catch(console.error)

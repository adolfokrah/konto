// MongoDB Migration: Rename "contributions" collection to "transactions"
// Run this BEFORE deploying the code changes.
//
// Usage with mongosh:
//   mongosh "mongodb://..." --file rename-contributions-to-transactions.js
//
// Or paste into MongoDB Compass shell / Railway MongoDB shell.

// Step 1: Rename the collection
db.contributions.renameCollection('transactions')
print('Step 1: Renamed collection contributions -> transactions')

// Step 2: Rename type "transfer" to "payout"
const typeResult = db.transactions.updateMany({ type: 'transfer' }, { $set: { type: 'payout' } })
print(`Step 2: Updated ${typeResult.modifiedCount} documents from type "transfer" to "payout"`)

// Step 3: Add isSettled field (default false) to all documents
const settledResult = db.transactions.updateMany(
  { isSettled: { $exists: false } },
  { $set: { isSettled: false } },
)
print(`Step 3: Added isSettled=false to ${settledResult.modifiedCount} documents`)

print('Migration complete!')

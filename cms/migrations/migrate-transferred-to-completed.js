// MongoDB Migration: Update all "transferred" transactions to "completed"
// Run this AFTER deploying the code changes that remove the "transferred" status.
//
// Usage with mongosh:
//   mongosh "mongodb://..." --file migrate-transferred-to-completed.js
//
// Or paste into MongoDB Compass shell / Railway MongoDB shell.

const result = db.transactions.updateMany(
  { paymentStatus: 'transferred' },
  { $set: { paymentStatus: 'completed' } },
)

print(`Updated ${result.modifiedCount} transactions from "transferred" to "completed"`)
print('Migration complete!')

const STATUS_LABELS: Record<string, string> = {
  awaiting_approval: 'Awaiting Approval',
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  rejected: 'Rejected',
}

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  awaiting_approval: { background: '#fef9c3', color: '#854d0e' },
  pending:           { background: '#dbeafe', color: '#1e40af' },
  'in-progress':     { background: '#ede9fe', color: '#6b21a8' },
  completed:         { background: '#dcfce7', color: '#166534' },
  failed:            { background: '#fee2e2', color: '#991b1b' },
  rejected:          { background: '#f3f4f6', color: '#4b5563' },
}

export default function RefundStatus({ cellData }: { cellData: string }) {
  const colors = STATUS_COLORS[cellData] || { background: '#f3f4f6', color: '#374151' }
  const label = STATUS_LABELS[cellData] || cellData

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: colors.background,
      color: colors.color,
    }}>
      {label}
    </span>
  )
}

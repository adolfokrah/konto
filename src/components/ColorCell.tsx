export default async function ColorCell({ cellData }: { cellData?: string }) {
  if (!cellData) {
    return null
  }

  return <div style={{ backgroundColor: cellData }} className="tw:w-10 tw:h-10 tw:rounded-sm"></div>
}

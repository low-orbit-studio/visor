export function BadToggle({ isActive }: { isActive: boolean }) {
  return (
    <button isActive={isActive} className="toggle">
      Toggle
    </button>
  )
}

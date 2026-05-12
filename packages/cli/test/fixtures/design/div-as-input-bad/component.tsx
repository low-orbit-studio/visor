export function BadDiv({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="fake-button">
      Click me
    </div>
  )
}

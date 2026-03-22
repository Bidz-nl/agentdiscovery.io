export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <header>
        <div>bezorgd.pizza</div>
      </header>
      <main>{children}</main>
      <footer>
        <div>Warm, lokaal en direct pizza bestellen.</div>
      </footer>
    </div>
  )
}

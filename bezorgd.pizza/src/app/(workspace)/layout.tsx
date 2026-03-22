export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#fffaf4] text-[#2f160c]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Provider workspace</p>
            <h1 className="text-2xl font-semibold text-[#2f160c]">Restaurantkant</h1>
            <p className="text-sm leading-6 text-[#6a3c24]">
              Werk bestellingen rustig bij en houd de operationele flow overzichtelijk terwijl payment later kan aanhaken.
            </p>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}

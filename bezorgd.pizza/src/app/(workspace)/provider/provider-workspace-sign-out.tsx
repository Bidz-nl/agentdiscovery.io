import { signOutFromProviderWorkspace } from '../login/actions'

export function ProviderWorkspaceSignOut() {
  return (
    <form action={signOutFromProviderWorkspace}>
      <button
        type="submit"
        className="rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-[#6a3c24] transition hover:border-[#c85b24] hover:text-[#2f160c]"
      >
        Afmelden
      </button>
    </form>
  )
}

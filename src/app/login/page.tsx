import { loginAction } from "@/lib/actions";
import { PinPad } from "@/components/PinPad";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-card-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-3xl">
            🔢
          </div>
          <h1 className="font-display text-2xl font-bold">Allie&apos;s Math Practice</h1>
          <p className="mt-1 text-sm text-muted">Enter your PIN to start practicing</p>
        </div>

        <form action={loginAction}>
          <PinPad hasError={hasError} />
        </form>
      </div>
    </div>
  );
}

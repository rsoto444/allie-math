import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { CheckupRunner } from "./CheckupRunner";
import type { Grade } from "@/lib/curriculum";

export default async function CheckupPage({ params }: PageProps<"/checkup/[grade]">) {
  const { grade } = await params;
  const g = Number(grade);
  if (![3, 4, 5, 6].includes(g)) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/dashboard" />
      <main className="flex-1 px-4 py-8">
        <CheckupRunner grade={g as Grade} />
      </main>
    </div>
  );
}

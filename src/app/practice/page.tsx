import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { PracticeSession } from "@/components/PracticeSession";
import { getProgressAction } from "@/lib/actions";

export default async function PracticePage() {
  const { path } = await getProgressAction();
  if (!path.current || path.nextAction === "checkup") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/practice" />
      <main className="flex-1 px-4 py-8">
        <PracticeSession
          key={path.current.key}
          skillName={path.current.name}
          initialStreak={path.practiceStreak}
        />
      </main>
    </div>
  );
}

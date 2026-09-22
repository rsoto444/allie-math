import { Nav } from "@/components/Nav";
import { PracticeSession } from "@/components/PracticeSession";

export default function PracticePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/practice" />
      <main className="flex-1 px-4 py-8">
        <PracticeSession mode="practice" />
      </main>
    </div>
  );
}

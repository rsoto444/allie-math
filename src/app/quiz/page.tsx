import { Nav } from "@/components/Nav";
import { AssessmentRunner } from "@/components/AssessmentRunner";

export default function QuizPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/quiz" />
      <main className="flex-1 px-4 py-8">
        <AssessmentRunner mode="quiz" title="Quiz" />
      </main>
    </div>
  );
}

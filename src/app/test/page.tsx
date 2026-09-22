import { Nav } from "@/components/Nav";
import { AssessmentRunner } from "@/components/AssessmentRunner";

export default function TestPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/test" />
      <main className="flex-1 px-4 py-8">
        <AssessmentRunner mode="test" title="Test" />
      </main>
    </div>
  );
}

import { Nav } from "@/components/Nav";
import { MasteryRunner } from "./MasteryRunner";

export default function MasteryPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/practice" />
      <main className="flex-1 px-4 py-8">
        <MasteryRunner />
      </main>
    </div>
  );
}

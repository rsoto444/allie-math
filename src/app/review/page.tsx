import { Nav } from "@/components/Nav";
import { ReviewRunner } from "./ReviewRunner";

export default function ReviewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/dashboard" />
      <main className="flex-1 px-4 py-8">
        <ReviewRunner />
      </main>
    </div>
  );
}

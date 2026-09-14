import { Used } from "../components/Used";
import { formatDate } from "../lib/format";
export default function Page() {
  return (
    <div>
      <Used />
      {formatDate(new Date())}
    </div>
  );
}

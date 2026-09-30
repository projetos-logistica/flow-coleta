import { cn } from "@/lib/utils";
import { statusClasses, type EditableField } from "@/lib/coletas";

type Props = {
  field: EditableField;
  value: string;
  options: readonly string[];
  allowEmpty?: boolean;
  onChange: (value: string) => void;
};

export function StatusSelect({ field, value, options, allowEmpty, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "cursor-pointer appearance-none rounded-full border-none px-2.5 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
        statusClasses(field, value),
      )}
    >
      {allowEmpty && <option value="">—</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

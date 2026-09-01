import { PatientWithRisk } from "../types";
import PatientRow from "./PatientRow";

interface Props {
  patients: PatientWithRisk[];
  onViewProfile: (patient: PatientWithRisk) => void;
}

export default function PatientList({ patients, onViewProfile }: Props) {
  if (patients.length === 0) {
    return null; // EmptyState is rendered by App when this would be empty
  }

  return (
    <div className="space-y-3">
      {patients.map((p) => (
        <PatientRow key={p.id} patient={p} onViewProfile={() => onViewProfile(p)} />
      ))}
    </div>
  );
}

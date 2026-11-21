import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ServicePicker from "@/components/ServicePicker";
import { Section, SectionFooter } from "@/components/Section";
import { updateEmployee, type EmployeeItem } from "@/service/employee";
import { getErrorMessage } from "@/rest";

interface ServicesSectionProps {
  employee: EmployeeItem;
  onSaved: (serviceIds: number[]) => void;
}

const sameIds = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export default function ServicesSection({
  employee,
  onSaved,
}: ServicesSectionProps) {
  const saved = employee.serviceIds;
  const [selected, setSelected] = useState<number[]>(saved);

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: () => updateEmployee(employee.id, { serviceIds: selected }),
    onSuccess: () => onSaved(selected),
  });

  const change = (next: number[]) => {
    setSelected(next);
    if (isError) reset();
  };

  return (
    <Section
      id="h-svc"
      title="Services"
      description="Choose the services this employee performs."
      badge={`${selected.length} selected`}
      defaultOpen
    >
      <ServicePicker selected={selected} onChange={change} />

      <SectionFooter
        dirty={!sameIds(selected, saved)}
        saving={isPending}
        error={isError ? getErrorMessage(error) : undefined}
        saveLabel="Save services"
        onDiscard={() => change(saved)}
        onSave={() => save()}
      />
    </Section>
  );
}

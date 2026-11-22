import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ServicePicker from "@/components/ServicePicker";
import { Section, SectionFooter } from "@/components/Section";
import { updateResource, type ResourceItem } from "@/service/resource";
import { getErrorMessage } from "@/rest";

interface ServicesSectionProps {
  resource: ResourceItem;
  onSaved: (updated: ResourceItem) => void;
}

const sameIds = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export default function ServicesSection({
  resource,
  onSaved,
}: ServicesSectionProps) {
  const saved = resource.serviceIds;
  const [selected, setSelected] = useState<number[]>(saved);

  const {
    mutate: save,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    // The update replaces the whole record, so send the saved details with it.
    mutationFn: () =>
      updateResource(resource.id, {
        name: resource.name,
        type: resource.type,
        description: resource.description,
        serviceIds: selected,
      }),
    onSuccess: onSaved,
  });

  const change = (next: number[]) => {
    setSelected(next);
    if (isError) reset();
  };

  return (
    <Section
      id="h-svc"
      title="Used with services"
      description="Pick every service that can use this resource."
      badge={`${selected.length} selected`}
      defaultOpen
    >
      <ServicePicker
        selected={selected}
        onChange={change}
        linkedWord="linked"
      />

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

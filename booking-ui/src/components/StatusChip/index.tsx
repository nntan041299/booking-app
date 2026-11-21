/** Active / Inactive pill with a status dot, as in the list pages of the design. */
export default function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[13px] font-medium whitespace-nowrap
                  ${active ? "bg-spa-green-50 text-spa-green-800" : "bg-spa-divider text-spa-muted"}`}
    >
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full ${active ? "bg-spa-green" : "bg-spa-inactive-dot"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

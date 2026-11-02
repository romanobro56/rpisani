export function StatusTabs({ base, active }: { base: string; active?: string }) {
  const tabs: [string | undefined, string][] = [
    [undefined, "All"],
    ["published", "Published"],
    ["draft", "Drafts"],
  ];
  return (
    <nav className="admin-tabs" aria-label="Filter by status">
      {tabs.map(([value, label]) => (
        <a
          key={label}
          href={value ? `${base}?status=${value}` : base}
          className={active === value ? "is-active" : undefined}
          aria-current={active === value ? "page" : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

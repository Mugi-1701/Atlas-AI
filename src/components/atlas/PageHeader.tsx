export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 md:px-8 pt-10 pb-6 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}
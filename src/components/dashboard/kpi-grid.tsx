import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{item.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}

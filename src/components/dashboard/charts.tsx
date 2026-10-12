"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const issueConfig = {
  issues: { label: "Issues", color: "var(--chart-1)" },
  returns: { label: "Returns", color: "var(--chart-2)" },
} satisfies ChartConfig;

const fineConfig = {
  amount: { label: "Collected", color: "var(--chart-3)" },
} satisfies ChartConfig;

const topConfig = {
  count: { label: "Loans", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function DashboardCharts({
  issuesVsReturns,
  byCategory,
  finesByMonth,
  topBooks,
}: {
  issuesVsReturns: { month: string; issues: number; returns: number }[];
  byCategory: { name: string; count: number }[];
  finesByMonth: { month: string; amount: number }[];
  topBooks: { title: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Issues and returns</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={issueConfig} className="h-64 w-full">
            <BarChart data={issuesVsReturns}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="issues" fill="var(--color-issues)" radius={4} />
              <Bar dataKey="returns" fill="var(--color-returns)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Books by category</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Titles", color: "var(--chart-1)" } }} className="h-64 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={byCategory} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80}>
                {byCategory.map((entry) => (
                  <Cell key={entry.name} fill="var(--chart-1)" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fines collected</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={fineConfig} className="h-64 w-full">
            <AreaChart data={finesByMonth}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="amount" fill="var(--color-amount)" stroke="var(--color-amount)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Most borrowed</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={topConfig} className="h-64 w-full">
            <BarChart data={topBooks} layout="vertical" margin={{ left: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="title" width={120} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

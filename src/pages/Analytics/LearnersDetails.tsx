import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useFrappeGetCall } from "frappe-react-sdk";

export default function LearnersDetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  const learners = apiData?.message?.learners || [];
  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    learners.filter((l: any) =>
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
    ),
    [learners, search]
  );
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 items-center">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No learners found.</TableCell>
                </TableRow>
              )}
              {filtered.map((l: any) => (
                <TableRow key={l.name}>
                  <TableCell>{l.full_name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>{l.last_active || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
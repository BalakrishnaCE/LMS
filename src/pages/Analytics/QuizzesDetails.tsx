import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useFrappeGetCall } from "frappe-react-sdk";

export default function QuizzesDetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  const quizzes = apiData?.message?.quizzes || [];
  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    quizzes.filter((q: any) =>
      q.title?.toLowerCase().includes(search.toLowerCase())
    ),
    [quizzes, search]
  );
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 items-center">
            <Input
              placeholder="Search by quiz title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">No quizzes found.</TableCell>
                </TableRow>
              )}
              {filtered.map((q: any) => (
                <TableRow key={q.name}>
                  <TableCell>{q.title}</TableCell>
                  <TableCell>{q.creation || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
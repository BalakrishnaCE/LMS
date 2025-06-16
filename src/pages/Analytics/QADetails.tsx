import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useFrappeGetCall } from "frappe-react-sdk";

export default function QADetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  const qas = apiData?.message?.qa_progress || [];
  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    qas.filter((qa: any) =>
      qa.question_answer?.toLowerCase().includes(search.toLowerCase()) ||
      qa.user?.toLowerCase().includes(search.toLowerCase())
    ),
    [qas, search]
  );
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Q&A Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 items-center">
            <Input
              placeholder="Search by QA or user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QA</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No QAs found.</TableCell>
                </TableRow>
              )}
              {filtered.map((qa: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{qa.question_answer}</TableCell>
                  <TableCell>{qa.user}</TableCell>
                  <TableCell>{qa.score ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
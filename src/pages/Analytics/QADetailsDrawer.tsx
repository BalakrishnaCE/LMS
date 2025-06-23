import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFrappePostCall } from "frappe-react-sdk";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Updated interface to match the actual API response
interface QuestionAnswerProgress {
  user: string;
  qa_id: string;
  module: {
    name1: string | null;
  };
  score?: number;
  max_score?: number;
  end_time?: string;
  start_time?: string;
  status?: 'Pending' | 'Scored';
  responses: {
    question: string;
    answer: string;
    suggested_answer: string;
  }[];
  time_limit_mins?: number;
  name?: string;
  score_added?: number;
}

interface QADetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuestionAnswerProgress | null;
}

export const QADetailsDrawer: React.FC<QADetailsDrawerProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [isScoring, setIsScoring] = useState(false);
  const [score, setScore] = useState("");
  const { call } = useFrappePostCall("updateQAScore");

  if (!isOpen || !item) return null;

  const handleAddScore = () => {
    setIsScoring(true);
  };

  const handleSaveScore = () => {
    if (!item) return;
    call({
      name: item.name,
      user: item.user,
      qa_id: item.qa_id,
      score: parseInt(score, 10),
    }).then(() => {
      setIsScoring(false);
      onClose();
    });
  };

  const convertHtmlToText = (html: string) => {
    try {
      if (typeof DOMParser === 'undefined') {
        return html.replace(/<[^>]*>?/gm, '');
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.body.textContent || "";
    } catch (e) {
      console.error("Could not parse HTML", e);
      return html;
    }
  };

  const handleExport = () => {
    if (!item) return;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Q&A Report", 14, 22);

    // Subtitle
    doc.setFontSize(12);
    doc.text(`Module: ${item.module?.name1 || 'N/A'}`, 14, 32);
    doc.text(`User: ${item.user}`, 14, 40);
    
    // Summary
    const summary = [
      ["Date", item.end_time ? new Date(item.end_time).toLocaleDateString() : 'N/A'],
      ["Score", item.score && item.max_score ? `${item.score}/${item.max_score} (${Math.round((item.score / item.max_score) * 100)}%)` : 'N/A'],
      ["Time Spent", timeSpent()],
      ["Time Limit", item.time_limit_mins ? `${item.time_limit_mins} mins` : "N/A"]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['', '']],
      body: summary,
      theme: 'grid',
      styles: {
        fontStyle: 'bold'
      },
      headStyles: {
        fillColor: [241, 245, 249] // secondary color
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
      }
    });

    // Responses Table
    const tableData = item.responses.map(q => [
      convertHtmlToText(q.question), 
      convertHtmlToText(q.answer), 
      convertHtmlToText(q.suggested_answer)
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Question', 'Answer', 'Suggested Answer']],
      body: tableData,
      headStyles: {
        fillColor: [37, 99, 235] // primary color
      }
    });

    doc.save(`${item.user}_${item.module?.name1 || 'QA'}_Report.pdf`);
  };

  const timeSpent = () => {
    if (!item.start_time || !item.end_time) return 'N/A';
    const duration = new Date(item.end_time).getTime() - new Date(item.start_time).getTime();
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    let timeString = '';
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    if (seconds > 0 || (hours === 0 && minutes === 0)) timeString += `${seconds}s`;
    return timeString.trim();
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="flex justify-between items-start">
            <div>
              <DrawerTitle>{item.module?.name1 || 'Q&A Details'}</DrawerTitle>
              <DrawerDescription>
                Detailed Q&A results for {item.user}
              </DrawerDescription>
            </div>
            <Button onClick={handleExport} variant="outline">Export to PDF</Button>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">User</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{item.user}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Score (%)</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold"> <span className="text-muted-foreground">Max Score: {item.max_score ? item.max_score : 'N/A'}</span>
                    <br />
                    Score: {item.score ? item.score : 'N/A'} ({item.score && item.max_score ? Math.round((item.score / item.max_score) * 100) + '%' : 'N/A'})
                  </p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Date</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{item.end_time ? new Date(item.end_time).toLocaleDateString() : 'N/A'}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Module</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{item.module?.name1 || 'N/A'}</p></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Answer Analysis</CardTitle>
                  {item.score_added === 0 && (
                    <Button onClick={handleAddScore}>Add Score</Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row justify-between mb-4">
                    <div className="flex flex-row gap-4">
                      <p className="text-sm font-medium">Time Limit: {item.time_limit_mins ? item.time_limit_mins + ' mins' : 'N/A'}</p>
                      <p className="text-sm font-medium">Time Spent: {timeSpent()}</p>
                    </div>
                  </div>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Answer</TableHead>
                          <TableHead>Suggested Answer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.responses.map((q, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {convertHtmlToText(q.question)}
                                </TableCell>
                                <TableCell>
                                  {convertHtmlToText(q.answer)}
                                </TableCell>
                                <TableCell>
                                  {convertHtmlToText(q.suggested_answer)}
                                </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <Dialog open={isScoring} onOpenChange={setIsScoring}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Score</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              type="number"
              placeholder="Enter score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              max={item.max_score}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Max score is {item.max_score}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScoring(false)}>Cancel</Button>
            <Button onClick={handleSaveScore}>Save Score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 
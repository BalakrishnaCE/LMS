import React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Updated interface to match the actual API response
interface QuizProgress {
  user: string;
  quiz_id: string;
  module: {
    name1: string | null;
  };
  score: number;
  max_score: number;
  date_attended?: string;
  time_limit_mins?: number;
  started_on?: string;
  ended_on?: string;
  data: {
    question: string;
    marked_ans: string | null;
    correct_ans: string | null;
  }[];
}

interface QuizDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuizProgress | null;
}

export const QuizDetailsDrawer: React.FC<QuizDetailsDrawerProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  const handleExport = () => {
    if (!item) return;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Quiz Report", 14, 22);

    // Subtitle
    doc.setFontSize(12);
    doc.text(`Module: ${item.module?.name1 || 'N/A'}`, 14, 32);
    doc.text(`User: ${item.user}`, 14, 40);

    // Summary
    const accuracy = Math.round((item.score / item.max_score) * 100);
    const summary = [
      ["Date", item.ended_on ? new Date(item.ended_on).toLocaleDateString() : 'N/A'],
      ["Score", `${accuracy}% (${item.score}/${item.max_score})`],
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
    // Strip HTML tags from questions for PDF export
    const stripHtml = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    // Responses Table
    const tableData = item.data.map(q => [
        stripHtml(q.question), 
        q.marked_ans || 'Not Answered', 
        q.correct_ans || 'N/A', 
        q.marked_ans === q.correct_ans ? 'Correct' : 'Incorrect'
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Question', 'Your Answer', 'Correct Answer', 'Result']],
      body: tableData,
      headStyles: {
        fillColor: [37, 99, 235] // primary color
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.cell.section === 'body') {
            if (data.cell.raw === 'Correct') {
                data.cell.styles.textColor = [34, 139, 34]; // ForestGreen
            }
            if (data.cell.raw === 'Incorrect') {
                data.cell.styles.textColor = [220, 20, 60]; // Crimson
            }
        }
      }
    });

    doc.save(`${item.user}_${item.module?.name1 || 'Quiz'}_Report.pdf`);
  };

  const accuracy = Math.round((item.score / item.max_score) * 100);

  const timeSpent = () => {
    if (!item.started_on || !item.ended_on) return 'N/A';
    const duration = new Date(item.ended_on).getTime() - new Date(item.started_on).getTime();
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    let timeString = '';

    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    if (seconds > 0 || (hours === 0 && minutes === 0)) timeString += `${seconds}s`;

    return timeString.trim();

  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex justify-between items-start">
          <div>
            <DrawerTitle>{item.module?.name1 || 'Quiz Details'}</DrawerTitle>
            <DrawerDescription>
              Detailed quiz results for {item.user}
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
                  <CardContent><p className="text-xl font-bold">{accuracy}%</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Date</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{item.ended_on ? new Date(item.ended_on).toLocaleDateString() : 'N/A'}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Module</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{item.module?.name1 || 'N/A'}</p></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Question Analysis</CardTitle>
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
                          <TableHead>Your Answer</TableHead>
                          <TableHead>Correct Answer</TableHead>
                          <TableHead className="text-right">Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.data.map((q, index) => {
                            const isCorrect = q.marked_ans === q.correct_ans;
                            return (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      <div dangerouslySetInnerHTML={{ __html: q.question }} />
                                    </TableCell>
                                    <TableCell>{q.marked_ans || 'Not Answered'}</TableCell>
                                    <TableCell>{q.correct_ans || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                    {isCorrect ? (
                                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                        <CheckCircle className="h-4 w-4 mr-1"/> Correct
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        <XCircle className="h-4 w-4 mr-1"/> Incorrect
                                      </Badge>
                                    )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}; 
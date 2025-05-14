import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
export default function Learners() {
  const [searchName, setSearchName] = React.useState("");
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchStatus, setSearchStatus] = React.useState("");
  return(
    <div className="flex flex-col items-center justify-center h-full">
    {/* active learners card and inactive learners card */}
    <div className="flex flex-row items-center justify-center h-full gap-4 mt-4">
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-60 h-32">
          <CardHeader>
            <CardTitle>Active Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <p>100</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-60 h-32">
          <CardHeader>
            <CardTitle>Inactive Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <p>100</p>
          </CardContent>
        </Card>
      </div>
    </div>
    {/* learners table */}
    <div className="flex flex-col items-center justify-center h-full w-2/3 mt-4">
      <Table>
      <TableHeader className="">
        <TableRow>
          <TableHead>
            <Input type="text" placeholder="Search by name" onChange={(e) => {
              setSearchName(e.target.value);
            }}  />
          </TableHead>
          <TableHead>
            <Input type="text" placeholder="Search by email" onChange={(e) => {
              setSearchEmail(e.target.value);
            }}/>
          </TableHead>
          <TableHead>
            <Input type="text" placeholder="Search by status" onChange={(e) => {
              setSearchStatus(e.target.value);
            }}/>
          </TableHead>
        </TableRow>
        
          <TableRow>
            {/* add filters in the table header */}
            
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className=" text-secondary-foreground">
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john.doe@example.com</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Doe</TableCell>
            <TableCell>jane.doe@example.com</TableCell>
            <TableCell>Inactive</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>

        </TableBody>
      </Table>
    </div>
    </div>
  );
}

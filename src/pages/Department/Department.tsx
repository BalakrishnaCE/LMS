import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Users, Calendar } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';

interface Department {
  name: string;
  department: string;
  member_count: number;
  created_at: string;
}

type DepartmentData = Department;

export default function DepartmentPage() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, mutate } = useFrappeGetCall<any>("novel_lms.novel_lms.api.analytics.get_departments_data");

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading departments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="text-red-500 mb-4">Error loading departments</div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Handle both nested and direct message structures
  // useFrappeGetCall wraps the response, so we need to check data.message
  const responseData = (data as any)?.message || data || {};
  const departments: DepartmentData[] = responseData.departments || [];
  const count = responseData.count || departments.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground">
              Manage and view all departments
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Department statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">Total Departments</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {departments.reduce((sum: number, dept: DepartmentData) => sum + (dept.member_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {departments.filter((dept: DepartmentData) => dept.created_at).length}
                </div>
                <div className="text-sm text-muted-foreground">Departments with Date</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>
            List of all departments with member count and creation date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No departments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {departments.map((dept: DepartmentData) => (
                <Card key={dept.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{dept.department || dept.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{dept.member_count || 0} {dept.member_count === 1 ? 'member' : 'members'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(dept.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


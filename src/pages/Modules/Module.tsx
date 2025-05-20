import { useFrappeGetDocList, useFrappeGetDocCount } from "frappe-react-sdk"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import Modules from "@/pages/Modules/Modules";
import { useEffect, useState } from "react";

function Module() {
    const { data: modules, error, isValidating } = useFrappeGetDocList("LMS Module", {
        fields: ["name", "name1", "description", "status", "image"],
    });

    // Get total count of modules
    const { data: totalCount } = useFrappeGetDocCount("LMS Module");
    
    // Get count of published modules
    const { data: publishedCount } = useFrappeGetDocCount("LMS Module", [
        ["status", "=", "Published"]
    ]);
    
    // Get count of draft modules
    const { data: draftCount } = useFrappeGetDocCount("LMS Module", [
        ["status", "=", "Draft"]
    ]);

    // Get count of approval pending modules
    const { data: pendingCount } = useFrappeGetDocCount("LMS Module", [
        ["status", "=", "Approval Pending"]
    ]);

    // Dynamically get CSS variable colors
    const [colors, setColors] = useState({
        primary: '#0ea5e9', // fallback Tailwind blue-500
        published: '#22c55e', // fallback Tailwind green-500 for published
        draft: '#9ca3af',    // Tailwind gray-400 for draft
        pending: '#f59e0b'   // Tailwind amber-500 for approval pending
    });

    useEffect(() => {
        setColors({
            primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#0ea5e9',
            published: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22c55e',
            draft: '#9ca3af',
            pending: '#f59e0b'
        });
    }, []);

    // Prepare data for the chart
    const chartData = [
        {
            name: 'Total',
            value: totalCount || 0,
            fill: colors.primary,
        },
        {
            name: 'Published',
            value: publishedCount || 0,
            fill: colors.published,
        },
        {
            name: 'Draft',
            value: draftCount || 0,
            fill: colors.draft,
        },
        {
            name: 'Approval Pending',
            value: pendingCount || 0,
            fill: colors.pending,
        }
    ];

    if (error) return <div>Error loading modules</div>;
    if (isValidating) return <div>Loading...</div>;

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Modules Overview</h1>
                <Link href="/module/new">
                    <Button>Add New Module</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Module Statistics</CardTitle>
                        <CardDescription>Overview of module status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                    barCategoryGap={30}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 16 }} />
                                    <YAxis tick={{ fontSize: 16 }} />
                                    <Tooltip
                                        contentStyle={{ fontSize: 16, borderRadius: 8 }}
                                        labelStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[8, 8, 0, 0]}
                                        label={{ position: 'top', fontSize: 16, fill: '#333' }}
                                        isAnimationActive={true}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>Module distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium">Total Modules</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                                    {totalCount || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Published Modules</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.published }}>
                                    {publishedCount || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Draft Modules</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.draft }}>
                                    {draftCount || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Approval Pending</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.pending }}>
                                    {pendingCount || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Modules itemsPerPage={20} />
        </div>
    )
}

export default Module
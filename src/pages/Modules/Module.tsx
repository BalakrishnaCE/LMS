import { useFrappeGetDocList } from "frappe-react-sdk"
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
  Legend
} from 'recharts';
import Modules from "@/pages/Modules/Modules";

function Module() {
    const { data: modules, error, isValidating } = useFrappeGetDocList("LMS Module", {
        fields: ["name", "name1", "description", "is_published", "image"],
    });

    // Prepare data for the chart
    const chartData = [
        {
            name: 'Published',
            value: modules?.filter(m => m.is_published === 1).length || 0,
            fill: '#22c55e'
        },
        {
            name: 'Draft',
            value: modules?.filter(m => m.is_published === 0).length || 0,
            fill: '#64748b'
        }
    ];

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Modules Overview</h1>
                <Link href="/modules/new">
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
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" />
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
                                <p className="text-2xl font-bold">{modules?.length || 0}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Published Modules</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {modules?.filter(m => m.is_published === 1).length || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Draft Modules</h3>
                                <p className="text-2xl font-bold text-gray-600">
                                    {modules?.filter(m => m.is_published === 0).length || 0}
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
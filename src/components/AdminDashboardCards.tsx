import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useFrappeGetCall } from "frappe-react-sdk"

interface User {
  name: string;
  full_name: string;
  email: string;
  creation: string;
}

interface Stats {
  percentage_change: number;
  previous_count: number;
  recent_count: number;
}

interface ApiData {
  stats: Stats;
  users: User[];
}

interface FrappeResponse {
  data: ApiData;
}

interface Module {
  name: string;
  name1: string;
  description: string;
  is_published: number;
  image: string | null;
  // add other fields as needed
}

interface ModuleApiData {
  modules: Module[];
  stats: Stats;
}

interface ModuleFrappeResponse {
  data: ModuleApiData;
}

export function AdminDashboardCards() {
  const { data: studentsData, error, isValidating } = useFrappeGetCall<FrappeResponse>("getStudentRoleCount");
  const { data: ModuleData, error : moduleError, isValidating : moduleValidating } = useFrappeGetCall<ModuleFrappeResponse>("moduleData");
  const stats = studentsData?.data?.stats;
  const users = studentsData?.data?.users;
  const percentageChange = stats?.percentage_change ?? 0;
  const isPositive = percentageChange >= 0;

  // Dynamic module stats
  const totalModules = ModuleData?.data?.modules?.length ?? 0;
  const publishedModules = ModuleData?.data?.modules?.filter((m: Module) => m.is_published)?.length ?? 0;
  
  // Calculate module statistics
  const moduleStats = ModuleData?.data?.stats;
  const modulePercentageChange = moduleStats?.percentage_change ?? 0;
  const isModulePositive = modulePercentageChange >= 0;
  const publishedPercentage = totalModules > 0 ? (publishedModules / totalModules) * 100 : 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Learners</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isValidating ? "..." : users?.length || 0}
          </CardTitle>
          <CardAction>
            <Badge 
              variant="outline" 
              
            >
              {isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {`${Math.abs(percentageChange).toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats 
              ? `${isPositive ? '+' : '-'}${stats.recent_count} new learners this week`
              : 'No data available'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Modules</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {moduleValidating ? "..." : totalModules}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isModulePositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {`${Math.abs(modulePercentageChange).toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {moduleStats 
              ? `${isModulePositive ? '+' : '-'}${moduleStats.recent_count} new modules this week`
              : 'No data available'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Published Modules</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {moduleValidating ? "..." : publishedModules}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {`${publishedPercentage.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {totalModules > 0 
              ? `${publishedModules} of ${totalModules} modules published`
              : 'No modules available'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Completion rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Increased from last week</div>
        </CardFooter>
      </Card>
    </div>
  )
}

import { IconTrendingDown, IconTrendingUp, IconUsers, IconBook, IconCheck, IconTarget } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useLMSAnalytics, useAdminModules } from "@/lib/api"

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
  status?: string;
}

interface ModuleApiData {
  modules: Module[];
  stats: Stats;
}

interface ModuleFrappeResponse {
  data: ModuleApiData;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "backOut"
    }
  }
}

// Card data configuration - using consistent design system colors
const cardConfig = [
  {
    key: "learners",
    title: "Total Learners",
    icon: IconUsers,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  },
  {
    key: "modules",
    title: "Total Modules",
    icon: IconBook,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  },
  {
    key: "published",
    title: "Published Modules",
    icon: IconCheck,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  },
  {
    key: "completion",
    title: "Completion Rate",
    icon: IconTarget,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  }
]

export function AdminDashboardCards() {
  const { data: analyticsData, error, isLoading: isValidating } = useLMSAnalytics();
  const { data: moduleResponse, error: moduleError, isLoading: moduleValidating } = useAdminModules();
  
  const stats = analyticsData?.message?.users_stats;
  const users = analyticsData?.message?.users;
  const ModuleData = { data: { modules: moduleResponse?.data?.modules || [], stats: analyticsData?.message?.modules_stats } };
  const percentageChange = stats?.percentage_change ?? 0;
  const isPositive = percentageChange >= 0;

  // Dynamic module stats
  const totalModules = ModuleData?.data?.modules?.length ?? 0;
  const publishedModules = ModuleData?.data?.modules?.filter((m: Module) => (m.status === "Published" ))?.length ?? 0;
  
  // Calculate module statistics
  const moduleStats = ModuleData?.data?.stats;
  const modulePercentageChange = moduleStats?.percentage_change ?? 0;
  const isModulePositive = modulePercentageChange >= 0;
  const publishedPercentage = totalModules > 0 ? (publishedModules / totalModules) * 100 : 0;

  // Card data
  const cardData = [
    {
      value: isValidating ? "..." : users?.length || 0,
      percentage: percentageChange,
      isPositive,
      description: stats 
        ? `${isPositive ? '+' : '-'}${stats.recent_count} new learners this week`
        : 'No data available'
    },
    {
      value: moduleValidating ? "..." : totalModules,
      percentage: modulePercentageChange,
      isPositive: isModulePositive,
      description: moduleStats 
        ? `${isModulePositive ? '+' : '-'}${moduleStats.recent_count} new modules this week`
        : 'No data available'
    },
    {
      value: moduleValidating ? "..." : publishedModules,
      percentage: publishedPercentage,
      isPositive: true,
      description: totalModules > 0 
        ? `${publishedModules} of ${totalModules} modules published`
        : 'No modules available'
    },
    {
      value: "4.5%",
      percentage: 4.5,
      isPositive: true,
      description: "Increased from last week"
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
    >
      {cardConfig.map((config, index) => {
        const IconComponent = config.icon;
        const data = cardData[index];
        
        return (
          <motion.div
            key={config.key}
            variants={cardVariants}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            className={`
              relative overflow-hidden rounded-2xl p-6
              bg-card text-card-foreground
              shadow-lg hover:shadow-2xl
              border border-border/50
              backdrop-blur-sm
              transition-all duration-300 ease-out
            `}
          >
            {/* Subtle background pattern */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    variants={iconVariants}
                    className={`
                      p-2 rounded-xl ${config.bgColor} ${config.darkBgColor}
                      shadow-sm border border-border/20
                    `}
                  >
                    <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {config.title}
                    </h3>
                  </div>
                </div>
                
                {/* Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  <Badge 
                    variant="secondary"
                    className={`
                      ${data.isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                      border-0 shadow-sm
                    `}
                  >
                    {data.isPositive ? <IconTrendingUp className="h-3 w-3 mr-1" /> : <IconTrendingDown className="h-3 w-3 mr-1" />}
                    {`${Math.abs(data.percentage).toFixed(1)}%`}
                  </Badge>
                </motion.div>
              </div>
              
              {/* Value */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="mb-2"
              >
                <div className="text-3xl font-bold text-foreground">
                  {data.value}
                </div>
              </motion.div>
              
              {/* Description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <p className="text-sm text-muted-foreground">
                  {data.description}
                </p>
              </motion.div>
            </div>
            
            {/* Subtle decorative accent */}
            <motion.div
              className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-5"
              style={{
                background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)"
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  )
}

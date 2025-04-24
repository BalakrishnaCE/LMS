import { useParams } from "wouter"
import { useFrappeGetDoc } from "frappe-react-sdk"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"


export default function ModuleDetail() {
    const params = useParams()
     const moduleName = params.moduleName

    const { data: module, error, isValidating } = useFrappeGetDoc("LMS Module", moduleName, {
        fields: ["name", "name1", "description", "is_published", "image", "lessons"]
    })

    // const {data: lessons, error: lessonsError, isValidating: lessonsIsValidating} = useFrappeGetDoc("Lesson", module.lessons[0], {
    //     fields: ["name", "name1", "description", "is_published", "image"]
    // })
    console.log(module.lessons)
    if (error) {    
        return <div>Error loading module</div>
    }

    if (isValidating) {
        return <div>Loading...</div>
    }

    if (!module) {
        return <div>Module not found</div>
    }

    return (
        <div className="container mx-auto p-4">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{module.name1}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">10%</span>
                        </div>
                        <Progress value={10} className="h-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 
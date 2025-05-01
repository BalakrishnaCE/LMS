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
import { Accordion } from "@/components/ui/accordion"
import { LessonWithChapters } from "@/components/LessonwithChapter"

import { useEffect, useState } from "react";


export function StaggeredLessons({ lessons }: { lessons: { lesson: string }[] }) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount < lessons.length) {
      const timeout = setTimeout(() => setVisibleCount(visibleCount + 1), 500); // 500ms delay
      return () => clearTimeout(timeout);
    }
  }, [visibleCount, lessons.length]);

  return (
    <>
      {lessons.slice(0, visibleCount).map((lesson) => (
        <LessonWithChapters key={lesson.lesson} lessonName={lesson.lesson} />
      ))}
      {visibleCount < lessons.length && <div>Loading next lesson...</div>}
    </>
  );
}

export default function ModuleDetail() {
    const params = useParams()
    const moduleName = params.moduleName

    const { data: module, error, isValidating } = useFrappeGetDoc("LMS Module", moduleName, {
        fields: ["name", "name1", "description", "is_published", "image", "lessons", "total_score", "has_scoring", "has_progress"]
    })

    if (error) {
        return <div>Error loading module</div>
    }

    if (isValidating) {
        return <div>Loading...</div>
    }

    if (!module) {
        return <div>Module not found</div>
    }
    // Sort lessons by order
    const sortedLessons = (module.lessons || []).sort((a: {order: number}, b: {order: number}) => a.order - b.order)
    console.log(sortedLessons.map((lesson: {name: string, lesson: string}) => lesson.lesson))
    return (
        <div className="container mx-auto p-4">
            <Card className="max-w-4xl mx-auto mb-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{module.name1}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {module.has_progress && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Progress</span>
                                <span className="text-sm font-medium">10%</span>
                            </div>
                            <Progress value={10} className="h-2" />
                        </div>
                    )}
                    {module.has_scoring && (
                        <div className="mt-4">
                            <span className="text-sm text-muted-foreground">Total Score: </span>
                            <span className="text-sm font-medium">{module.total_score}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-semibold mb-4">Lessons</h2>
                <Accordion type="single" collapsible className="w-full">
                    <StaggeredLessons lessons={sortedLessons} />
                </Accordion>
            </div>
        </div>
    )
} 
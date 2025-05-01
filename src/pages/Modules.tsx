import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { IconPointFilled } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {  useFrappeGetDocList } from "frappe-react-sdk"
import { Progress } from "@/components/ui/progress"
import { Link } from "wouter"

function Modules () {
    const { data: module_data, error: module_error, isValidating } = useFrappeGetDocList("LMS Module",
        {
          fields: ["name", "name1", "description", "is_published", "image"],
        }
      )
    const module_list = module_data?.map((module: { name: string; name1: string; description: string; is_published: number; image: string; }) => ({
        name: module.name,
        name1: module.name1,
        description: module.description,
        is_published: module.is_published,
        image: module.image,
      }))
    console.log(module_list)
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-300 p-4">
        {module_list?.map((module) => (
          <Card className="@container/card border-t-2 " key={module.name}>
            <CardHeader>
              <CardTitle className="text-sm ont-semibold ">
                {module.name1}
              </CardTitle>
              <CardAction>
                    {module.is_published === 1 ? (
                        <Badge variant="outline" >
                            <IconPointFilled className="text-primary" />
                            <p className="">Published</p>
                        </Badge>
                    ) : (
                        <Badge variant="outline" >
                            <IconPointFilled className="text-accent-foreground" />
                            <p className="">Draft</p>
                        </Badge>
                    )}
                </CardAction>
            </CardHeader>
            <CardContent>
            <CardDescription>{module.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between flex-col gap-4">
                <Progress value={10} className="text-sm" />
                <Link href={`/module/${module.name}`} className="w-full">
                    <Button variant="outline" className="hover:text-white w-full">View</Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
        </div>
    </div>
  );
}
export default Modules;
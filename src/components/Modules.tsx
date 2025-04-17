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
// import { Toaster } from "./ui/sonner"


function Modules() {
    function handleClick() {
        // toast.success("Module added successfully!")
        // toast.message("Module added successfully!")
        // toast.warning("Module added successfully!")
        // toast.info("Module added successfully!")
       
        // toast.error("Module added successfully!")
        // toast.promise(
        //     new Promise((resolve) => setTimeout(resolve, 2000)),
        //     {
        //         loading
        //         : "Adding module...",
        //         success: "Module added successfully!",
        //         error: "Module added successfully!",
        //     }
        // )
        
      }
  return (
    <div >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card className="@container/card">
            
            <CardHeader>
                <CardTitle className="text-xl ont-semibold ">Modern React Development </CardTitle>
                <CardAction>
                    <Badge variant="outline" >
                        <IconPointFilled />
                            <p className="">Draft</p>
                    </Badge>
                </CardAction>
            </CardHeader>
                
           
            <CardContent className="flex flex-col gap-4 justify-center items-center">
            <CardDescription className=" "> Learn to build modern React applications with hooks and context </CardDescription>
                {/* <img src="https://picsum.photos/200/200" alt="Module 1" className="rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out" /> */}
            </CardContent>
            
            <CardFooter className=" justify-center">
                <Button variant="outline" className="hover:text-white" onClick={handleClick}>View Progress</Button>
        </CardFooter>
        </Card>
        <Card className="@container/card">
            
            <CardHeader>
                <CardTitle className="text-xl ont-semibold ">Modern React Development </CardTitle>
                <CardAction>
                    <Badge variant="outline" >
                        <IconPointFilled />
                            <p className="">Draft</p>
                    </Badge>
                </CardAction>
            </CardHeader>
                
           
            <CardContent className="flex flex-col gap-4 justify-center items-center">
            <CardDescription className=" "> Learn to build modern React applications with hooks and context </CardDescription>
                {/* <img src="https://picsum.photos/200/200" alt="Module 1" className="rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out" /> */}
            </CardContent>
            
            <CardFooter className=" justify-center">
                <Button variant="outline" className="hover:text-white" onClick={handleClick}>View Progress</Button>
        </CardFooter>
        </Card>
        <Card className="@container/card">
            
            <CardHeader>
                <CardTitle className="text-xl ont-semibold ">Modern React Development </CardTitle>
                <CardAction>
                    <Badge variant="outline" >
                        <IconPointFilled />
                            <p className="">Draft</p>
                    </Badge>
                </CardAction>
            </CardHeader>
                
           
            <CardContent className="flex flex-col gap-4 justify-center items-center">
            <CardDescription className=" "> Learn to build modern React applications with hooks and context </CardDescription>
                {/* <img src="https://picsum.photos/200/200" alt="Module 1" className="rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out" /> */}
            </CardContent>
            
            <CardFooter className=" justify-center">
                <Button variant="outline" className="hover:text-white" onClick={handleClick}>View Progress</Button>
        </CardFooter>
        </Card>
        <Card className="@container/card">
            
            <CardHeader>
                <CardTitle className="text-xl ont-semibold ">Modern React Development </CardTitle>
                <CardAction>
                    <Badge variant="outline" >
                        <IconPointFilled />
                            <p className="">Draft</p>
                    </Badge>
                </CardAction>
            </CardHeader>
                
           
            <CardContent className="flex flex-col gap-4 justify-center items-center">
            <CardDescription className=" "> Learn to build modern React applications with hooks and context </CardDescription>
                {/* <img src="https://picsum.photos/200/200" alt="Module 1" className="rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out" /> */}
            </CardContent>
            
            <CardFooter className=" justify-center">
                <Button variant="outline" className="hover:text-white" onClick={handleClick}>View Progress</Button>
        </CardFooter>
        </Card>
        <Card className="@container/card">
            
            <CardHeader>
                <CardTitle className="text-xl ont-semibold ">Modern React Development </CardTitle>
                <CardAction>
                    <Badge variant="outline" >
                        <IconPointFilled />
                            <p className="">Draft</p>
                    </Badge>
                </CardAction>
            </CardHeader>
                
           
            <CardContent className="flex flex-col gap-4 justify-center items-center">
            <CardDescription className=" "> Learn to build modern React applications with hooks and context </CardDescription>
                {/* <img src="https://picsum.photos/200/200" alt="Module 1" className="rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out" /> */}
            </CardContent>
            
            <CardFooter className=" justify-center">
                <Button variant="outline" className="hover:text-white" onClick={handleClick}>View Progress</Button>
        </CardFooter>
        </Card>
        <Card className="@container/card">
            
            <CardHeader>
                <CardTitle className="text-xl ont-semibold ">Modern React Development </CardTitle>
                <CardAction>
                    <Badge variant="outline" >
                        <IconPointFilled />
                            <p className="">Draft</p>
                    </Badge>
                </CardAction>
            </CardHeader>
                
           
            <CardContent className="flex flex-col gap-4 justify-center items-center">
            <CardDescription className=" "> Learn to build modern React applications with hooks and context </CardDescription>
                {/* <img src="https://picsum.photos/200/200" alt="Module 1" className="rounded-md shadow-md hover:scale-105 transition-transform duration-300 ease-in-out" /> */}
            </CardContent>
            
            <CardFooter className=" justify-center">
                <Button variant="outline" className="hover:text-white" onClick={handleClick}>View Progress</Button>
        </CardFooter>
        </Card>
      </div>
    </div>
  );
}
export default Modules;
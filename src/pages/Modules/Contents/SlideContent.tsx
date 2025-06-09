import { useFrappeGetDoc } from "frappe-react-sdk";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link } from 'wouter';
import { LMS_API_BASE_URL } from "@/config/routes";

function SlideContent({ slideContentId }: { slideContentId: string }) {
  const { data: slideContentData, error, isValidating } = useFrappeGetDoc("Slide Content", slideContentId);

  if (isValidating) return <div>Loading slides...</div>;
  if (error) return <div>Error loading slides</div>;
  if (!slideContentData) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-2">{slideContentData.title}</h2>
      <div className="mb-4" dangerouslySetInnerHTML={{ __html: slideContentData.description || "" }} />
      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {slideContentData.slide_show_items?.map((item: any) => (
              <CarouselItem key={item.name} className="flex flex-col items-center justify-center p-4">
                <div className="text-center">
                  <h4 className="font-semibold">{item.heading}</h4>
                  {item.image && <img src={`${LMS_API_BASE_URL}/${item.image}`} alt={item.heading} className="my-2 max-w-full" />}
                  <p>{item.description}</p>
                  {item.url && (
                    <Link href={`${LMS_API_BASE_URL}/${item.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      More
                    </Link>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2" />
          <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2" />
        </Carousel>
      </div>
    </div>
  );
}

export default SlideContent;
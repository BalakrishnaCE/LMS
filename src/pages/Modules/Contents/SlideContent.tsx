import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link } from 'wouter';
import { LMS_API_BASE_URL } from "@/config/routes";

// Component for individual slide items with image error handling
function SlideItem({ item }: { item: any }) {
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Normalize URL to handle both relative and full URLs properly
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${LMS_API_BASE_URL.replace(/\/$/, '')}${url}`;
  };
  
  const imageUrl = item.image ? getImageUrl(item.image) : '';
  console.log('Slide item image:', { original: item.image, constructed: imageUrl, heading: item.heading });
  
  return (
    <CarouselItem className="flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h4 className="font-semibold">{item.heading}</h4>
        {item.image && !imageLoadError ? (
          <img 
            src={imageUrl} 
            alt={item.heading} 
            className="my-2 max-w-full" 
            onError={() => {
              console.error('Image failed to load:', imageUrl);
              setImageLoadError(true);
            }} 
            loading="eager"
          />
        ) : (
          <div className="my-2 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <p className="text-gray-600 font-medium">Image not present</p>
            <p className="text-sm text-gray-500">Image file is not available for this slide.</p>
          </div>
        )}
        <p>{item.description}</p>
        {item.url && (
          <Link href={item.url.startsWith('http') ? item.url : `${LMS_API_BASE_URL}${item.url.startsWith('/') ? item.url.slice(1) : item.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            More
          </Link>
        )}
      </div>
    </CarouselItem>
  );
}

function SlideContent({ slideContentId }: { slideContentId: string }) {
  const [slideContentData, setSlideContentData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!slideContentId) return;
    
    setIsValidating(true);
    setError(null);
    
    // Use content access API that works without authentication
    fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.content_access.get_content_with_permissions?content_type=Slide%20Content&content_reference=${slideContentId}`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        // Handle the response structure from content_access API
        const responseData = res.message?.message || res.message || res;
        
        if (responseData.success && responseData.data) {
          setSlideContentData(responseData.data);
        } else {
          console.error('SlideContent API Error Response:', responseData);
          const errorMessage = typeof responseData.message === 'string' 
            ? responseData.message 
            : JSON.stringify(responseData.message) || 'Failed to load slide content';
          throw new Error(errorMessage);
        }
        setIsValidating(false);
      })
      .catch(e => {
        console.error('SlideContent API Error:', e);
        setError(e.message || 'Failed to load slide content');
        setIsValidating(false);
      });
  }, [slideContentId]);

  if (isValidating) return <div>Loading slides...</div>;
  if (error) return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Slides</h3>
        <p className="text-red-500">{typeof error === 'string' ? error : 'Failed to load slide content'}</p>
      </div>
    </div>
  );
  if (!slideContentData) return null;

  // Display slide content regardless of is_active status

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-2">{slideContentData.title}</h2>
      <div className="mb-4" dangerouslySetInnerHTML={{ __html: slideContentData.description || "" }} />
      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {slideContentData.slide_show_items?.map((item: any) => (
              <SlideItem key={item.name} item={item} />
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
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link } from 'wouter';
import { LMS_API_BASE_URL, LMS_FILE_BASE_URL } from '@/config/routes';

// Component for individual slide items with image error handling
function SlideItem({ item }: { item: any }) {
  const [imageLoadError, setImageLoadError] = useState(false);

  // Normalize URL to handle both relative and full URLs properly
  // Uses lms.noveloffice.org as base URL in both development and production
  const getImageUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    // If already a full URL, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Ensure path starts with / if it doesn't already
    const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    // Determine base URL
    // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
    // In development: use http://lms.noveloffice.org
    const baseUrl = LMS_API_BASE_URL || LMS_FILE_BASE_URL;
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    return `${cleanBaseUrl}${relativePath}`;
  };

  const imageUrl = item.image ? getImageUrl(item.image) : '';
  console.log('Slide item image:', { original: item.image, constructed: imageUrl, heading: item.heading });

  const renderDescription = (desc: string) => {
    if (!desc) return null;
    if (desc.includes(', ')) {
      const parts = desc.split(', ');
      return (
        <ul className="list-disc list-inside text-left inline-block max-w-xl mx-auto my-3 text-gray-700">
          {parts.map((part, index) => (
            <li key={index} className="mb-2 text-base leading-relaxed">{part}</li>
          ))}
        </ul>
      );
    }
    return <p className="text-gray-700 my-3 text-base leading-relaxed">{desc}</p>;
  };

  return (
    <CarouselItem className="flex flex-col items-center justify-center p-6">
      <div className="text-center w-full max-w-2xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">{item.heading}</h4>
        {item.image ? (
          !imageLoadError ? (
            <img
              src={imageUrl}
              alt={item.heading}
              className="my-4 max-h-[300px] object-contain mx-auto rounded-lg shadow-sm border border-gray-100"
              onError={() => {
                console.error('Image failed to load:', imageUrl);
                setImageLoadError(true);
              }}
              loading="eager"
            />
          ) : (
            <div className="my-4 p-4 bg-red-50 rounded-lg border border-red-200 inline-block">
              <p className="text-red-700 font-medium text-sm">Image failed to load</p>
            </div>
          )
        ) : null}
        <div className="w-full flex justify-center">
          {renderDescription(item.description)}
        </div>
        {item.url && (() => {
          // Normalize URL for links - use same logic as getImageUrl
          const getLinkUrl = (url: string) => {
            if (!url) return '';
            const trimmed = url.trim();
            if (!trimmed) return '';

            // If already a full URL, return as is
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
              return trimmed;
            }

            // Ensure path starts with / if it doesn't already
            const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

            // Determine base URL
            const baseUrl = LMS_API_BASE_URL || LMS_FILE_BASE_URL;
            const cleanBaseUrl = baseUrl.replace(/\/$/, '');

            return `${cleanBaseUrl}${relativePath}`;
          };

          const linkUrl = getLinkUrl(item.url);
          return (
            <Link href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              More
            </Link>
          );
        })()}
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

    // Use content_access.get_content_with_permissions API (allows guest access and bypasses permissions)
    // Determine API base URL
    // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
    // In development: use http://lms.noveloffice.org
    const apiBaseUrl = LMS_API_BASE_URL || LMS_FILE_BASE_URL;
    const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    const apiUrl = `${cleanApiBaseUrl}/api/method/novel_lms.novel_lms.api.content_access.get_content_with_permissions?content_type=Slide Content&content_reference=${slideContentId}`;

    console.log('📡 Fetching slide content:', { slideContentId, apiUrl });

    fetch(apiUrl, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch slide content: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(res => {
        console.log('📦 SlideContent API response:', res);

        // Handle the response structure from content_management.get_content API
        // Response format: { message: { success: true, data: {...}, content_type: "...", message: "..." } }
        let contentData = null;
        if (res.message && res.message.message && res.message.message.success === true) {
          contentData = res.message.message.data;
        } else if (res.message && res.message.success === true) {
          contentData = res.message.data;
        } else if (res.message && res.message.data) {
          contentData = res.message.data;
        } else if (res.data) {
          contentData = res.data;
        }

        if (contentData) {
          setSlideContentData(contentData);
        } else {
          const errorMessage = res.message?.message?.message || res.message?.message || res.message || 'Failed to load slide content';
          console.error('SlideContent API Error - No data found:', JSON.stringify(res, null, 2));
          throw new Error(errorMessage || 'Slide content data not found in response');
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
  let parsedMetadata: any[] | null = null;
  if (slideContentData.presentation_metadata) {
    try {
      parsedMetadata = typeof slideContentData.presentation_metadata === 'string'
        ? JSON.parse(slideContentData.presentation_metadata)
        : slideContentData.presentation_metadata;
    } catch (e) {
      console.error("Failed to parse presentation_metadata:", e);
    }
  }

  const hasHtmlSlides = Array.isArray(parsedMetadata) && parsedMetadata.length > 0 && parsedMetadata.some((s: any) => s.slide_html);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-2">{slideContentData.title}</h2>
      <div className="mb-4" dangerouslySetInnerHTML={{ __html: slideContentData.description || "" }} />
      <div className="relative">
        {hasHtmlSlides ? (
          <Carousel className="w-full">
            <CarouselContent>
              {parsedMetadata!.map((slide: any, idx: number) => (
                <SlideIframeItem key={idx} slide={slide} />
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2" />
            <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2" />
          </Carousel>
        ) : (
          <Carousel className="w-full">
            <CarouselContent>
              {slideContentData.slide_show_items?.map((item: any) => (
                <SlideItem key={item.name} item={item} />
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2" />
            <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2" />
          </Carousel>
        )}
      </div>
    </div>
  );
}

function SlideIframeItem({ slide }: { slide: any }) {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <CarouselItem className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {slide.title && <h4 className="text-lg font-bold text-gray-800 mb-3">{slide.title}</h4>}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-950">
          <iframe
            key={iframeKey}
            srcDoc={slide.slide_html}
            title={slide.title || "Slide"}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
          <button
            onClick={() => setIframeKey(prev => prev + 1)}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs text-white rounded-lg backdrop-blur border border-slate-700 transition"
          >
            🔄 Replay Motion
          </button>
        </div>
      </div>
    </CarouselItem>
  );
}

export default SlideContent;
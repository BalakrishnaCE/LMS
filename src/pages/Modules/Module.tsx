import { useFrappeGetDocList, useFrappeGetDocCount } from "frappe-react-sdk"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import {
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import Modules from "@/pages/Modules/Modules";
import { useEffect, useState, useRef } from "react";
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

// Interactive Pie Chart Component
function InteractivePieChart({ data }: { data: any[] }) {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // mouse move: compute local pos, hit-test exact SVG element under pointer
  const onWrapperMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    // prefer tooltip below cursor with a small offset, but flip if near bottom
    const OFFSET = 16;
    const EST_TOOLTIP_H = 56; // estimate
    let tooltipY = mouseY + OFFSET;
    if (mouseY + OFFSET + EST_TOOLTIP_H > bounds.height) {
      tooltipY = mouseY - OFFSET - EST_TOOLTIP_H; // flip above if would overflow
    }

    // keep horizontal centered on mouse
    const tooltipX = mouseX;

    setCursorPos({ x: tooltipX, y: tooltipY });

    // hit-test real element under cursor (client coordinates)
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const sliceEl = target?.closest("[data-pie-index]") as HTMLElement | null;

    if (sliceEl && sliceEl.dataset && typeof sliceEl.dataset.pieIndex !== "undefined") {
      const idx = Number(sliceEl.dataset.pieIndex);
      if (!Number.isNaN(idx) && data[idx]) {
        setHoveredSlice({ name: data[idx].name, value: data[idx].value });
        return;
      }
    }

    // nothing under pointer (hole or outside) -> hide
    setHoveredSlice(null);
  };

  const onWrapperMouseLeave = () => {
    setCursorPos(null);
    setHoveredSlice(null);
  };

  const TooltipDiv = ({ top, left, slice }: { top: number; left: number; slice: { name: string; value: number } }) => (
    <div
      className="absolute bg-card border border-border rounded-lg p-3 shadow-lg pointer-events-none"
      style={{
        top,
        left,
        transform: "translate(-50%, 0)", // center horizontally; vertical already chosen in onMouseMove
        whiteSpace: "nowrap",
        zIndex: 50,
      }}
    >
      <p className="font-medium text-card-foreground">{slice.name}</p>
      <p className="text-sm text-muted-foreground">
        Count: <span className="font-semibold">{slice.value}</span>
      </p>
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className="h-60 w-full relative"
      onMouseMove={onWrapperMouseMove}
      onMouseLeave={onWrapperMouseLeave}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            paddingAngle={8}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                data-pie-index={index} // <- important: used by hit-test
                fill={entry.fill}
                stroke={entry.fill}
                strokeWidth={2}
                // keep onMouseEnter to support keyboard/focus interactions if needed
                onMouseEnter={() => setHoveredSlice({ name: entry.name, value: entry.value })}
              />
            ))}
          </Pie>

          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.payload.fill }}>
                {value} ({entry.payload.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {cursorPos && hoveredSlice && (
        <TooltipDiv top={cursorPos.y} left={cursorPos.x} slice={hoveredSlice} />
      )}
    </div>
  );
}

function Module() {
    const { error, isValidating } = useFrappeGetDocList("LMS Module", {
        fields: ["name", "name1", "description", "status", "image"],
    });

    // Get total count of modules
    const { data: totalCount } = useFrappeGetDocCount("LMS Module");
    
    // Get count of published modules
    const { data: publishedCount } = useFrappeGetDocCount("LMS Module", [
        ["status", "=", "Published"]
    ]);
    
    // Get count of draft modules
    const { data: draftCount } = useFrappeGetDocCount("LMS Module", [
        ["status", "=", "Draft"]
    ]);
    
    // Get count of archived modules
    const { data: archivedCount } = useFrappeGetDocCount("LMS Module", [
        ["status", "=", "Archived"]
    ]);

    // Toggle state for showing archived modules
    const [showArchived, setShowArchived] = useState(false);

    // Colors - using CSS variable for primary (used for both Total and Published), accent for archived
    const [colors, setColors] = useState({
        primary: '#14b8a6', // fallback teal color (same as Total and Published)
        published: '#14b8a6', // same teal color as Total Modules
        draft: '#9ca3af',    // Tailwind gray-400 for draft
        archived: '#0ea5e9'   // fallback accent color for archived
    });

    useEffect(() => {
        // Get primary color from CSS variable, use same for both Total and Published
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || 
                            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || 
                            '#14b8a6';
        // Get accent color from CSS variable for archived modules
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
                           getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
                           '#0ea5e9';
        setColors(prev => ({
            ...prev,
            primary: primaryColor || '#14b8a6',
            published: primaryColor || '#14b8a6', // Same color as Total Modules
            archived: accentColor || '#0ea5e9' // Accent color for archived
        }));
    }, []);

    // Calculate percentages for better visualization
    const total = totalCount || 0;
    const published = publishedCount || 0;
    const draft = draftCount || 0;
    const archived = archivedCount || 0;
    
    const publishedPercent = total > 0 ? (published / total) * 100 : 0;
    const draftPercent = total > 0 ? (draft / total) * 100 : 0;
    const archivedPercent = total > 0 ? (archived / total) * 100 : 0;

    // Prepare data for the interactive pie chart - show Total, Published, Draft, and Archived
    const pieChartData = [
        {
            name: 'Total Modules',
            value: total,
            percentage: 100,
            fill: colors.primary,
        },
        {
            name: 'Published Modules',
            value: published,
            percentage: publishedPercent,
            fill: colors.published,
        },
        {
            name: 'Draft Modules',
            value: draft,
            percentage: draftPercent,
            fill: colors.draft,
        },
        {
            name: 'Archived Modules',
            value: archived,
            percentage: archivedPercent,
            fill: colors.archived,
        }
    ];

    if (error) return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-red-500">Error loading modules</div>
      </div>
    );
    if (isValidating) return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading...</div>
      </div>
    );

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Modules Overview</h1>
                <Link href="/edit">
                    <Button>Add New Module</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Left side - Quick Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>Module distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium">Total Modules</h3>
                                <p className="text-3xl font-bold" style={{ color: colors.primary }}>
                                    {totalCount || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Published Modules</h3>
                                <p className="text-3xl font-bold" style={{ color: colors.published }}>
                                    {publishedCount || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Draft Modules</h3>
                                <p className="text-3xl font-bold" style={{ color: colors.draft }}>
                                    {draftCount || 0}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">Archived Modules</h3>
                                <p className="text-3xl font-bold" style={{ color: colors.archived }}>
                                    {archivedCount || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right side - Interactive Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Module Distribution</CardTitle>
                        <CardDescription>Visual breakdown of module status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InteractivePieChart data={pieChartData} />
                    </CardContent>
                </Card>
            </div>

            <Modules itemsPerPage={8} showArchived={showArchived} onShowArchivedChange={setShowArchived} />
        </div>
    )
}

export default Module
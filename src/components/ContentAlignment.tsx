import React from 'react';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Label } from '@/components/ui/label';

export type Alignment = 'left' | 'center' | 'right';

interface ContentAlignmentProps {
  alignment: Alignment;
  onChange: (alignment: Alignment) => void;
  className?: string;
}

const ContentAlignment: React.FC<ContentAlignmentProps> = ({ alignment, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Label className="whitespace-nowrap">Content Alignment</Label>
      <div className="flex gap-1 border rounded-md p-1 bg-muted/50">
        <Button
          size="icon"
          variant={alignment === 'left' ? 'default' : 'ghost'}
          onClick={() => onChange('left')}
          className="h-8 w-8"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={alignment === 'center' ? 'default' : 'ghost'}
          onClick={() => onChange('center')}
          className="h-8 w-8"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={alignment === 'right' ? 'default' : 'ghost'}
          onClick={() => onChange('right')}
          className="h-8 w-8"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const getAlignmentClass = (alignment: Alignment = 'left') => {
  switch (alignment) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return 'text-left';
  }
};

export default ContentAlignment; 
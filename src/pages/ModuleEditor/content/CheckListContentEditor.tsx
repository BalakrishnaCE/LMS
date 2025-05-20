import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import RichEditor from '@/components/RichEditor';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface CheckListItem {
  item: string;
  content: string;
  alignment?: 'left' | 'center' | 'right';
}

interface CheckListContentEditorProps {
  content: { title: string; check_list_items: CheckListItem[] };
  onSave: (content: { title: string; check_list_items: CheckListItem[] }) => void;
  onCancel?: () => void;
}

const CheckListContentEditor: React.FC<CheckListContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title || '');
  const [items, setItems] = useState<CheckListItem[]>(content.check_list_items || []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<CheckListItem>({ item: '', content: '', alignment: 'left' });

  const handleItemChange = (idx: number, field: keyof CheckListItem, value: string | 'left' | 'center' | 'right') => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddItem = () => {
    if (!newItem.item.trim() && !newItem.content.trim()) return;
    setItems(prev => [...prev, { ...newItem, alignment: newItem.alignment || 'left' }]);
    setNewItem({ item: '', content: '', alignment: 'left' });
  };

  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleReorderItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setItems(updated);
  };

  const getAlignmentClass = (alignment: string = 'left') => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter checklist title" />
      </div>
      <div>
        <Label>Checklist Items</Label>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-2 border rounded p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={item.item}
                  onChange={e => handleItemChange(idx, 'item', e.target.value)}
                  placeholder="Item name"
                  className="w-1/4"
                />
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleReorderItem(idx, idx - 1)} disabled={idx === 0}>↑</Button>
                  <Button size="icon" variant="ghost" onClick={() => handleReorderItem(idx, idx + 1)} disabled={idx === items.length - 1}>↓</Button>
                  <Button size="icon" variant="destructive" onClick={() => handleRemoveItem(idx)}>✕</Button>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Alignment</Label>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant={item.alignment === 'left' ? 'default' : 'ghost'}
                      onClick={() => handleItemChange(idx, 'alignment', 'left')}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={item.alignment === 'center' ? 'default' : 'ghost'}
                      onClick={() => handleItemChange(idx, 'alignment', 'center')}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={item.alignment === 'right' ? 'default' : 'ghost'}
                      onClick={() => handleItemChange(idx, 'alignment', 'right')}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className={getAlignmentClass(item.alignment)}>
                  <RichEditor
                    content={item.content}
                    onChange={value => handleItemChange(idx, 'content', value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="space-y-2 border rounded p-4">
            <div className="flex items-center gap-2">
              <Input
                value={newItem.item}
                onChange={e => setNewItem(s => ({ ...s, item: e.target.value }))}
                placeholder="Item name"
                className="w-1/4"
              />
              <Button size="sm" onClick={handleAddItem} disabled={!newItem.item && !newItem.content}>Add</Button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Alignment</Label>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant={newItem.alignment === 'left' ? 'default' : 'ghost'}
                    onClick={() => setNewItem(s => ({ ...s, alignment: 'left' }))}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={newItem.alignment === 'center' ? 'default' : 'ghost'}
                    onClick={() => setNewItem(s => ({ ...s, alignment: 'center' }))}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={newItem.alignment === 'right' ? 'default' : 'ghost'}
                    onClick={() => setNewItem(s => ({ ...s, alignment: 'right' }))}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className={getAlignmentClass(newItem.alignment)}>
                <RichEditor
                  content={newItem.content}
                  onChange={value => setNewItem(s => ({ ...s, content: value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button onClick={() => onSave({ title, check_list_items: items })}>Save</Button>
      </div>
    </div>
  );
};

export default CheckListContentEditor; 
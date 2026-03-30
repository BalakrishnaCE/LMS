import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import RichEditor from '@/components/RichEditor';

interface ChecklistItem {
  id: string;
  item: string;
  content: string;
  checked: boolean;
}

interface ChecklistContentEditorProps {
  content: { title: string; check_list_item: any[] };
  onSave: (data: { title: string; check_list_item: any[] }) => void;
  onCancel?: () => void;
}

export default function ChecklistContentEditor({ content, onSave, onCancel }: ChecklistContentEditorProps) {
  const safeContent = content || { title: '', check_list_item: [] };
  const [title, setTitle] = useState(safeContent.title);
  const [items, setItems] = useState<ChecklistItem[]>(
    Array.isArray(safeContent.check_list_item)
      ? safeContent.check_list_item.map((item: any) => ({
          id: item.id || item.name || (Date.now().toString() + Math.random()),
          item: item.item || '',
          content: item.content || '',
          checked: false,
          ...item,
        }))
      : []
  );

  useEffect(() => {
    setTitle(safeContent.title);
    setItems(
      Array.isArray(safeContent.check_list_item)
        ? safeContent.check_list_item.map((item: any) => ({
            id: item.id || item.name || (Date.now().toString() + Math.random()),
            item: item.item || '',
            content: item.content || '',
            checked: false,
            ...item,
          }))
        : []
    );
  }, [safeContent]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), item: '', content: '', checked: false }]);
  };

  const updateItemText = (id: string, newText: string) => {
    setItems(items.map(item => (item.id === id ? { ...item, item: newText } : item)));
  };

  const updateItemContent = (id: string, content: string) => {
    setItems(items.map(item => (item.id === id ? { ...item, content } : item)));
  };

  const toggleItemChecked = (id: string) => {
    setItems(items.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = () => {
    const payload = {
      title,
      check_list_item: items.map((item, idx) => {
        const { id, checked, ...rest } = item;
        return {
          ...rest,
          name: item.item || id, // backend expects 'name'
          idx: idx + 1,
        };
      }),
    };
    onSave(payload);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Checklist Title"
        className="text-lg font-semibold"
      />
      <div className="flex flex-col gap-2">
        {items && items.length > 0 && items.map((item, idx) => (
          <div key={item.id} className="flex flex-col gap-2 border rounded-md p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox checked={item.checked} onCheckedChange={() => toggleItemChecked(item.id)} />
              <Input
                value={item.item}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                placeholder="Checklist item name"
                className="font-semibold"
              />
              <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="pl-8">
            <RichEditor content={item.content} onChange={(content) => updateItemContent(item.id, content)} />
            </div>
          </div>
        ))}
        <Button onClick={addItem}>Add Item</Button>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={handleSave}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
} 
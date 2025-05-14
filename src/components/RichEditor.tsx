import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit } from 'reactjs-tiptap-editor';
import { useEffect, useState } from "react";
import { Bold } from 'reactjs-tiptap-editor/bold';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Code } from 'reactjs-tiptap-editor/code';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { Image } from 'reactjs-tiptap-editor/image';
import 'react-image-crop/dist/ReactCrop.css'; 
import { Italic } from 'reactjs-tiptap-editor/italic';
import { Link } from 'reactjs-tiptap-editor/link';
import { Table } from 'reactjs-tiptap-editor/table';
// import { TextBubble } from 'reactjs-tiptap-editor/textbubble'; 
import { FormatPainter } from 'reactjs-tiptap-editor/formatpainter'; 
import { FontSize } from 'reactjs-tiptap-editor/fontsize'; 
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule'; 
import { History } from 'reactjs-tiptap-editor/history';
import { Iframe } from 'reactjs-tiptap-editor/iframe'; 
import { Indent } from 'reactjs-tiptap-editor/indent'; 
import { LineHeight } from 'reactjs-tiptap-editor/lineheight'; 
import { ListItem } from 'reactjs-tiptap-editor/listitem'; 
import { MoreMark } from 'reactjs-tiptap-editor/moremark'; 
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn'; 
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist'; 
import { Selection } from 'reactjs-tiptap-editor/selection'; 
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline'; 


import 'reactjs-tiptap-editor/style.css';

interface RichEditorProps {
    content: string;
    onChange: (content: string) => void;
    disabled?: boolean;
}

const extensions = [
    BaseKit.configure({
        placeholder: {
            showOnlyCurrent: true,
        },
        characterCount: {
            limit: 50_000,
        },
    }),
    History.configure(),
    Bold.configure(),
    Italic.configure(),
    TextUnderline.configure(),
    FontSize.configure(),
    BulletList.configure(),
    ListItem.configure(),
    OrderedList.configure(),
    // TextBubble.configure(), //unknown feels like a bubble around the text
    Code.configure(),
    Heading.configure({
        levels: [1, 2, 3],
    }),
    Image.configure({
      upload: async (files: File) => {
        const formData = new FormData();
        formData.append('file', files);

        try {
          const response = await fetch('http://10.80.4.72/api/method/upload_file', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'token xxxx:yyyy',
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload file');
          }

          const data = await response.json();
          console.log("File Upload complete");
          return data.file_url;
        } catch (e) {
          console.error(e);
          throw new Error('Failed to upload file');
        }
      },
    }),
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-primary hover:underline',
        },
    }),
    Table.configure({
        resizable: true,
    }),
    FormatPainter.configure(),
    Highlight.configure(),
    HorizontalRule.configure(),
    Iframe.configure(),
    Indent.configure(),
    LineHeight.configure(),
    MoreMark.configure(),
    ColumnActionButton.configure(),
    Selection.configure()
    
];

const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, disabled = false }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <div className={`rich-editor ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <RichTextEditor
                output='html'
                content={content || ''}
                onChangeContent={onChange}
                extensions={extensions}
                minHeight="500px"
            />
        </div>
    );
};

export default RichEditor;
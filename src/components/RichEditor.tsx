import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit } from 'reactjs-tiptap-editor';
import { useEffect, useState, useRef } from "react";
import { Bold } from 'reactjs-tiptap-editor/bold';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Code } from 'reactjs-tiptap-editor/code';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { Image } from 'reactjs-tiptap-editor/image';
import 'react-image-crop/dist/ReactCrop.css'; 
import { Italic } from 'reactjs-tiptap-editor/italic';
import { Link } from 'reactjs-tiptap-editor/link';
import { Table } from 'reactjs-tiptap-editor/table';
import { TextBubble } from 'reactjs-tiptap-editor/textbubble'; 
import { FormatPainter } from 'reactjs-tiptap-editor/formatpainter'; 
import { FontSize } from 'reactjs-tiptap-editor/fontsize'; 
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule'; 
import { History } from 'reactjs-tiptap-editor/history';
import { Iframe } from 'reactjs-tiptap-editor/iframe'; 
import { Indent } from 'reactjs-tiptap-editor/indent'; 
import { LineHeight } from 'reactjs-tiptap-editor/lineheight'; 
import { Color } from 'reactjs-tiptap-editor/color'; 
import { ListItem } from 'reactjs-tiptap-editor/listitem'; 
import { MoreMark } from 'reactjs-tiptap-editor/moremark'; 
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn'; 
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist'; 
import { Selection } from 'reactjs-tiptap-editor/selection'; 
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline'; 
import { TextAlign } from 'reactjs-tiptap-editor/textalign'; 
import { Mermaid } from 'reactjs-tiptap-editor/mermaid'; 
import { BubbleMenuMermaid } from 'reactjs-tiptap-editor/bubble-extra'; 
import { Video } from 'reactjs-tiptap-editor/video'; 
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily'; 
import { SlashCommand } from 'reactjs-tiptap-editor/slashcommand'; 
import { Strike } from 'reactjs-tiptap-editor/strike'; 
import { Emoji } from 'reactjs-tiptap-editor/emoji'; 
import { LMS_API_BASE_URL } from "@/config/routes";
import { useTheme } from "@/components/theme-provider";

import 'reactjs-tiptap-editor/style.css';

interface RichEditorProps {
    content: string;
    onChange: (content: string) => void;
    disabled?: boolean;
    theme?: string;
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
    History.configure({
        depth: 100,
        newGroupDelay: 500,
    }),
    Bold.configure(),
    Italic.configure(),
    TextUnderline.configure(),
    Code.configure(),
    Heading.configure({
        levels: [1, 2, 3],
    }),
    Strike.configure(),
    BulletList.configure(),
    OrderedList.configure(),
    // ListItem.configure(),
    FontSize.configure(),
    FontFamily.configure(),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),
    Emoji.configure(),
    Image.configure({
      upload: async (files: File) => {
        const formData = new FormData();
        formData.append('file', files);

        try {
          const response = await fetch(`${LMS_API_BASE_URL}api/method/upload_file`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
            },
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to upload file');
          }
          const data = await response.json();
          return LMS_API_BASE_URL + data.message.file_url
        } catch (e) {
          console.error(e);
          throw new Error('Failed to upload file');
        }
      },
    }),
    Video.configure({
      
        upload: async (files: File) => {
            const formData = new FormData();
            formData.append('file', files);
            try {
                const response = await fetch(`${LMS_API_BASE_URL}/api/method/upload_file`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                    },
                    body: formData,
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to upload file');
                }
                const data = await response.json();
                return LMS_API_BASE_URL + data.message.file_url
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
    Color.configure(),
    Highlight.configure(),
    HorizontalRule.configure(),
    Iframe.configure(),
    Indent.configure(),
    LineHeight.configure(),
    MoreMark.configure(),
    ColumnActionButton.configure(),
    Mermaid.configure(),
    SlashCommand.configure(),
    TextBubble.configure(),
];

const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, disabled = false }) => {
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();
    const observerRef = useRef<MutationObserver | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const root = window.document.documentElement;

        // Initial enforcement
        root.classList.remove("light", "dark");
        root.classList.add(theme === "dark" ? "dark" : "light");

        // Set up MutationObserver to enforce only one class
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new MutationObserver(() => {
            if (root.classList.contains("light") && root.classList.contains("dark")) {
                root.classList.remove(theme === "dark" ? "light" : "dark");
            }
        });
        observerRef.current.observe(root, { attributes: true, attributeFilter: ["class"] });

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [theme, isMounted]);

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
                dark={theme === 'dark'}
                bubbleMenu={{
                    render({ extensionsNames, editor, disabled }, bubbleDefaultDom) {
                      return <>
                        {bubbleDefaultDom}
              
                        {extensionsNames.includes('mermaid')  ? <BubbleMenuMermaid disabled={disabled}
                          editor={editor}
                          key="mermaid"
                        /> : null}
                      </>
                    },
                  }}
                  toolbar={{
                    render: (props, toolbarItems, dom, containerDom) => {
                      return containerDom(dom)
                    }
                  }}
           />
        </div>
    );
};

export default RichEditor;
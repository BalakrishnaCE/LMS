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
// SlashCommand removed - it interferes with space key input
// import { SlashCommand } from 'reactjs-tiptap-editor/slashcommand'; 
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
    // SlashCommand removed - it was preventing space key from working
    // SlashCommand.configure(),
    TextBubble.configure(),
];

const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, disabled = false }) => {
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();
    const observerRef = useRef<MutationObserver | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

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

    // Direct fix to ensure space key always works
    useEffect(() => {
        if (!isMounted) return;

        const insertSpaceDirectly = (editorElement: HTMLElement) => {
            try {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    // If no selection, try to insert at the end
                    const range = document.createRange();
                    range.selectNodeContents(editorElement);
                    range.collapse(false);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
                
                const range = selection?.getRangeAt(0);
                if (!range) return;
                
                // Insert space character
                const textNode = document.createTextNode(' ');
                range.insertNode(textNode);
                
                // Move cursor after the space
                range.setStartAfter(textNode);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
                
                // Trigger input event to notify editor
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                editorElement.dispatchEvent(inputEvent);
            } catch (error) {
                console.error('Error inserting space:', error);
            }
        };

        const fixSpaceKey = () => {
            // Find all editor elements
            const editorElements = document.querySelectorAll('.rich-editor .ProseMirror, .rich-editor [contenteditable="true"]');
            
            editorElements.forEach((element) => {
                const el = element as HTMLElement;
                
                // Ensure whitespace is preserved
                el.style.whiteSpace = 'pre-wrap';
                
                // Add keydown handler that ALWAYS inserts space
                const handleKeyDown = (e: KeyboardEvent) => {
                    if (e.key === ' ' || e.keyCode === 32) {
                        // Always prevent default and insert space manually to ensure it works
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        
                        // Insert space directly
                        insertSpaceDirectly(el);
                    }
                };
                
                // Remove any existing handler and add new one with capture (highest priority)
                el.removeEventListener('keydown', handleKeyDown as EventListener, true);
                el.addEventListener('keydown', handleKeyDown as EventListener, true);
                
                // Also add keypress handler as backup
                const handleKeyPress = (e: KeyboardEvent) => {
                    if (e.key === ' ' || e.keyCode === 32 || e.charCode === 32) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        insertSpaceDirectly(el);
                    }
                };
                
                el.removeEventListener('keypress', handleKeyPress as EventListener, true);
                el.addEventListener('keypress', handleKeyPress as EventListener, true);
            });
        };

        // Apply fix immediately
        fixSpaceKey();

        // Apply fix after delays to catch dynamically created elements
        const timeout1 = setTimeout(fixSpaceKey, 50);
        const timeout2 = setTimeout(fixSpaceKey, 200);
        const timeout3 = setTimeout(fixSpaceKey, 500);
        const timeout4 = setTimeout(fixSpaceKey, 1000);
        const timeout5 = setTimeout(fixSpaceKey, 2000);

        // Use MutationObserver to catch editor initialization
        const observer = new MutationObserver(() => {
            fixSpaceKey();
        });

        const richEditorContainer = editorContainerRef.current || document.querySelector('.rich-editor');
        if (richEditorContainer) {
            observer.observe(richEditorContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            });
        }

        // Global handler that ALWAYS inserts space when pressed in editor
        const globalHandler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInEditor = target?.closest?.('.rich-editor .ProseMirror, .rich-editor [contenteditable="true"]');
            
            if (isInEditor && (e.key === ' ' || e.keyCode === 32)) {
                // Prevent any other handlers from interfering
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                
                // Insert space directly
                const editorEl = target.closest('.ProseMirror, [contenteditable="true"]') as HTMLElement;
                if (editorEl) {
                    insertSpaceDirectly(editorEl);
                }
            }
        };

        // Use capture phase with highest priority
        document.addEventListener('keydown', globalHandler, { capture: true, passive: false });

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
            clearTimeout(timeout3);
            clearTimeout(timeout4);
            clearTimeout(timeout5);
            observer.disconnect();
            document.removeEventListener('keydown', globalHandler, { capture: true } as EventListenerOptions);
        };
    }, [isMounted]);

    if (!isMounted) {
        return null;
    }

    return (
        <div 
            ref={editorContainerRef}
            className={`rich-editor ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onKeyDown={(e) => {
                // Direct handler on container - always insert space when pressed
                if (e.key === ' ' || e.keyCode === 32) {
                    const target = e.target as HTMLElement;
                    const editorEl = target.closest('.ProseMirror, [contenteditable="true"]') as HTMLElement;
                    if (editorEl) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Insert space directly
                        try {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                const textNode = document.createTextNode(' ');
                                range.insertNode(textNode);
                                range.setStartAfter(textNode);
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);
                                
                                // Trigger input event
                                const inputEvent = new Event('input', { bubbles: true });
                                editorEl.dispatchEvent(inputEvent);
                            }
                        } catch (err) {
                            console.error('Error inserting space:', err);
                        }
                    }
                }
            }}
        >
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
           <style dangerouslySetInnerHTML={{__html: `
             .rich-editor .ProseMirror {
               white-space: pre-wrap !important;
             }
             .rich-editor .ProseMirror p,
             .rich-editor .ProseMirror div,
             .rich-editor .ProseMirror span,
             .rich-editor .ProseMirror li,
             .rich-editor .ProseMirror * {
               white-space: pre-wrap !important;
             }
             .rich-editor [contenteditable="true"] {
               white-space: pre-wrap !important;
             }
           `}} />
        </div>
    );
};

export default RichEditor;
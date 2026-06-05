import { useEffect } from 'react';

export function useCodeBlockFormatter() {
  useEffect(() => {
    const formatBlocks = () => {
      // Find pre elements that are inside our prose containers and not already wrapped
      const preElements = document.querySelectorAll('.prose pre, .text-content-prose pre');

      preElements.forEach((pre) => {
        // Only format if it's an HTMLElement and hasn't been wrapped yet
        if (!(pre instanceof HTMLElement)) return;
        if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

        // Create wrapper container
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper flex flex-col rounded-[12px] overflow-hidden border border-[rgba(100,130,180,0.22)] dark:border-[rgba(60,70,90,0.25)] my-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] bg-[#f3f4f6] dark:bg-[#32363a]';

        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Override pre styles to fit seamlessly in the wrapper
        pre.style.margin = '0';
        pre.style.border = 'none';
        pre.style.borderRadius = '0';
        pre.style.background = 'transparent';
        pre.style.boxShadow = 'none'; // Ensure pre doesn't have its own shadow

        // Create header
        const header = document.createElement('div');
        header.className = 'code-block-header flex items-center justify-between px-3 py-1.5 bg-[#e5e7eb] dark:bg-[#2a2e31] border-b border-[rgba(100,130,180,0.2)] dark:border-[rgba(60,70,90,0.2)] text-[12px] font-medium text-[#000000] dark:text-[#f8fafc]';

        // Detect language
        const code = pre.querySelector('code');
        let lang = 'Code';
        if (code) {
          const classes = Array.from(code.classList);
          const langClass = classes.find(c => c.startsWith('language-'));
          if (langClass) {
            const rawLang = langClass.replace('language-', '');
            lang = rawLang.charAt(0).toUpperCase() + rawLang.slice(1);
          }
        }

        // Left side: Label/Language
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tracking-[0.3px] uppercase font-semibold font-mono pl-1';
        labelSpan.innerText = lang;
        header.appendChild(labelSpan);

        // Right side: Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[rgba(100,130,180,0.15)] dark:hover:bg-[rgba(255,255,255,0.1)] hover:text-[#1e293b] dark:hover:text-[#ffffff] transition-colors cursor-pointer';
        copyBtn.setAttribute('aria-label', 'Copy code');

        const copyIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        `;
        const checkIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        `;

        copyBtn.innerHTML = `${copyIcon} <span>Copy</span>`;

        copyBtn.type = 'button';
        copyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const codeText = code ? code.textContent : pre.textContent;
          if (!codeText) return;

          const handleSuccess = () => {
            copyBtn.innerHTML = `${checkIcon} <span style="color: #10b981;">Copied!</span>`;
            setTimeout(() => {
              copyBtn.innerHTML = `${copyIcon} <span>Copy</span>`;
            }, 2000);
          };

          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(codeText)
              .then(handleSuccess)
              .catch(err => console.error('Failed to copy text: ', err));
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = codeText;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              if (document.execCommand('copy')) {
                handleSuccess();
              }
            } catch (err) {
              console.error('Fallback copy failed: ', err);
            }
            document.body.removeChild(textArea);
          }
        });

        header.appendChild(copyBtn);
        wrapper.insertBefore(header, pre);
      });
    };

    // Initial run
    formatBlocks();

    // Setup MutationObserver to watch for dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      let shouldFormat = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldFormat = true;
          break;
        }
      }
      if (shouldFormat) {
        // Use requestAnimationFrame to let DOM settle
        requestAnimationFrame(() => {
          formatBlocks();
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);
}

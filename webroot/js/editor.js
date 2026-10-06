/**
 * HTML Editor
 *
 * Lightweight contenteditable WYSIWYG editor.
 * Syncs content to the underlying textarea on input, blur, and form submit.
 *
 * Dependencies: Bootstrap 5, Bootstrap Icons.
 * Optional: FileBrowser when options.fileBrowser is set (file and image picker).
 */
const HtmlEditor = (function() {
    'use strict';

    const ALIGN_ACTIONS = {
        alignLeft: 'left',
        alignCenter: 'center',
        alignRight: 'right',
        alignJustify: 'justify',
    };

    const BLOCK_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'BLOCKQUOTE', 'PRE', 'LI'];
    const FORMAT_BLOCK_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'BLOCKQUOTE', 'PRE'];

    const CLEAN_KEEP_TAGS = {
        P: true, BR: true, H1: true, H2: true, H3: true, H4: true, H5: true, H6: true,
        STRONG: true, B: true, EM: true, I: true, U: true, S: true, STRIKE: true,
        DEL: true, INS: true, SUB: true, SUP: true, UL: true, OL: true, LI: true,
        A: true, IMG: true, BLOCKQUOTE: true, PRE: true, CODE: true, DIV: true,
        HR: true, TABLE: true, THEAD: true, TBODY: true, TFOOT: true, TR: true,
        TH: true, TD: true, CAPTION: true, COL: true, COLGROUP: true,
    };

    const CLEAN_DROP_TAGS = {
        SCRIPT: true, STYLE: true, META: true, LINK: true, TITLE: true, BASE: true,
        IFRAME: true, OBJECT: true, EMBED: true, APPLET: true, FORM: true, INPUT: true,
        BUTTON: true, SELECT: true, TEXTAREA: true, SVG: true, MATH: true,
    };

    const CLEAN_ATTRS = {
        A: { href: true, title: true, target: true, rel: true },
        IMG: { src: true, alt: true },
        TABLE: { class: true, style: true },
        TD: { colspan: true, rowspan: true, class: true, style: true },
        TH: { colspan: true, rowspan: true, class: true, style: true },
        COL: { class: true, style: true, span: true },
        COLGROUP: { class: true, style: true, span: true },
        CAPTION: { class: true, style: true },
    };

    const TABLE_STYLE_WHITELIST = {
        width: true,
        height: true,
        'text-align': true,
        'vertical-align': true,
        'background-color': true,
        padding: true,
        'margin-left': true,
        'margin-right': true,
        border: true,
        'border-width': true,
        'border-style': true,
        'border-color': true,
        'border-collapse': true,
        'border-spacing': true,
        'border-top': true,
        'border-right': true,
        'border-bottom': true,
        'border-left': true,
    };

    const TABLE_GRID_SIZE = 10;
    const HISTORY_LIMIT = 100;
    const HISTORY_DEBOUNCE = 400;
    const SOURCE_INDENT = '  ';
    const SOURCE_HIGHLIGHT_LIMIT = 200000;

    const VOID_TAGS = {
        area: true, base: true, br: true, col: true, embed: true, hr: true,
        img: true, input: true, link: true, meta: true, param: true, source: true,
        track: true, wbr: true,
    };

    const INLINE_TAGS = {
        a: true, abbr: true, b: true, bdi: true, bdo: true, br: true, cite: true,
        code: true, data: true, dfn: true, em: true, i: true, img: true, kbd: true,
        mark: true, q: true, s: true, samp: true, small: true, span: true,
        strong: true, sub: true, sup: true, time: true, u: true, var: true, wbr: true,
        del: true, ins: true, strike: true,
    };

    const PRESERVE_TAGS = {
        pre: true, textarea: true, script: true, style: true,
    };

    /**
     * @param {string} text
     * @returns {string}
     */
    function escapeSource(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Split HTML source into highlight tokens.
     *
     * @param {string} source
     * @returns {Array<{text: string, cls: (string|null)}>}
     */
    function tokenizeSource(source) {
        const tokens = [];
        let i = 0;
        const len = source.length;
        let preserveTag = null;

        /**
         * @param {string} text
         * @param {string|null} cls
         */
        function push(text, cls) {
            if (text) {
                tokens.push({ text: text, cls: cls });
            }
        }

        while (i < len) {
            if (preserveTag) {
                const close = '</' + preserveTag;
                const closeIdx = source.toLowerCase().indexOf(close, i);
                if (closeIdx === -1) {
                    push(source.slice(i), null);
                    break;
                }
                push(source.slice(i, closeIdx), null);
                i = closeIdx;
                preserveTag = null;
                continue;
            }

            if (source[i] === '<') {
                if (source.substr(i, 4) === '<!--') {
                    const end = source.indexOf('-->', i + 4);
                    const endPos = end === -1 ? len : end + 3;
                    push(source.slice(i, endPos), 'tok-comment');
                    i = endPos;
                    continue;
                }

                if (source[i + 1] === '!' || source[i + 1] === '?') {
                    const end = source.indexOf('>', i + 2);
                    const endPos = end === -1 ? len : end + 1;
                    push(source.slice(i, endPos), 'tok-doctype');
                    i = endPos;
                    continue;
                }

                const tagMatch = source.slice(i).match(/^<\/?([a-zA-Z][\w:-]*)/);
                if (!tagMatch) {
                    push(source[i], null);
                    i++;
                    continue;
                }

                const isClose = source[i + 1] === '/';
                const tagName = tagMatch[1].toLowerCase();
                push(tagMatch[0], 'tok-tag');
                i += tagMatch[0].length;

                while (i < len) {
                    const ch = source[i];
                    if (ch === '>') {
                        push('>', 'tok-tag');
                        i++;
                        break;
                    }
                    if (ch === '/' && source[i + 1] === '>') {
                        push('/>', 'tok-tag');
                        i += 2;
                        break;
                    }
                    if (/\s/.test(ch) || ch === '=') {
                        push(ch, null);
                        i++;
                        continue;
                    }
                    if (ch === '"' || ch === "'") {
                        const quote = ch;
                        let j = i + 1;
                        while (j < len && source[j] !== quote) {
                            j++;
                        }
                        if (j < len) {
                            j++;
                        }
                        push(source.slice(i, j), 'tok-value');
                        i = j;
                        continue;
                    }

                    const attrMatch = source.slice(i).match(/^[^\s="'<>/]+/);
                    if (attrMatch) {
                        push(attrMatch[0], 'tok-attr');
                        i += attrMatch[0].length;
                        continue;
                    }

                    push(ch, null);
                    i++;
                }

                if (!isClose && PRESERVE_TAGS[tagName] && !VOID_TAGS[tagName]) {
                    preserveTag = tagName;
                }
                continue;
            }

            if (source[i] === '&') {
                const entityMatch = source.slice(i).match(/^&(#\d+|#x[\da-fA-F]+|[a-zA-Z]\w*);/);
                if (entityMatch) {
                    push(entityMatch[0], 'tok-entity');
                    i += entityMatch[0].length;
                    continue;
                }
            }

            let j = i + 1;
            while (j < len && source[j] !== '<' && source[j] !== '&') {
                j++;
            }
            push(source.slice(i, j), null);
            i = j;
        }

        return tokens;
    }

    /**
     * Syntax-highlight HTML source, one HTML string per logical line.
     *
     * @param {string} source
     * @returns {Array<string>}
     */
    function highlightLines(source) {
        const lines = [''];

        tokenizeSource(source).forEach(function(token) {
            const parts = token.text.split('\n');
            parts.forEach(function(part, index) {
                if (index > 0) {
                    lines.push('');
                }
                if (!part) {
                    return;
                }
                const escaped = escapeSource(part);
                lines[lines.length - 1] += token.cls
                    ? '<span class="' + token.cls + '">' + escaped + '</span>'
                    : escaped;
            });
        });

        return lines;
    }

    /**
     * Pretty-print HTML, indenting only around block-level tags.
     *
     * @param {string} source
     * @returns {string}
     */
    function formatHtml(source) {
        const tokens = [];
        let i = 0;
        const len = source.length;

        while (i < len) {
            if (source[i] === '<') {
                if (source.substr(i, 4) === '<!--') {
                    const end = source.indexOf('-->', i + 4);
                    const endPos = end === -1 ? len : end + 3;
                    tokens.push({ type: 'comment', value: source.slice(i, endPos) });
                    i = endPos;
                    continue;
                }

                const tagMatch = source.slice(i).match(/^<\/?([a-zA-Z][\w:-]*)((?:\s[^>]*)?)(\/?)>/);
                if (tagMatch) {
                    const full = tagMatch[0];
                    const name = tagMatch[1].toLowerCase();
                    const isClose = full[1] === '/';
                    const selfClosing = tagMatch[3] === '/' || VOID_TAGS[name];
                    let type = 'open';
                    if (isClose) {
                        type = 'close';
                    } else if (selfClosing) {
                        type = 'void';
                    }
                    tokens.push({ type: type, name: name, value: full, inline: !!INLINE_TAGS[name] });
                    i += full.length;

                    if (type === 'open' && PRESERVE_TAGS[name]) {
                        const close = '</' + name;
                        const closeIdx = source.toLowerCase().indexOf(close, i);
                        if (closeIdx !== -1) {
                            tokens.push({ type: 'raw', value: source.slice(i, closeIdx) });
                            i = closeIdx;
                        }
                    }
                    continue;
                }

                const end = source.indexOf('>', i + 1);
                const endPos = end === -1 ? len : end + 1;
                tokens.push({ type: 'text', value: source.slice(i, endPos) });
                i = endPos;
                continue;
            }

            let j = i + 1;
            while (j < len && source[j] !== '<') {
                j++;
            }
            tokens.push({ type: 'text', value: source.slice(i, j) });
            i = j;
        }

        let result = '';
        let depth = 0;
        let atLineStart = true;

        /**
         * @param {number} level
         */
        function writeIndent(level) {
            result += SOURCE_INDENT.repeat(Math.max(0, level));
        }

        /**
         * @param {boolean} [force]
         */
        function ensureNewline(force) {
            if (!atLineStart || force) {
                if (result.length && result[result.length - 1] !== '\n') {
                    result += '\n';
                }
                atLineStart = true;
            }
        }

        /**
         * Write indent when starting a new line of content.
         */
        function indentIfNeeded() {
            if (atLineStart) {
                writeIndent(depth);
                atLineStart = false;
            }
        }

        tokens.forEach(function(token) {
            if (token.type === 'text' || token.type === 'raw') {
                if (token.type === 'raw') {
                    result += token.value;
                    atLineStart = token.value.length === 0 || token.value[token.value.length - 1] === '\n';
                    return;
                }

                if (/^\s*$/.test(token.value)) {
                    return;
                }

                const parts = token.value.split(/(\n+)/);
                parts.forEach(function(part) {
                    if (!part) {
                        return;
                    }
                    if (/^\n+$/.test(part)) {
                        result += '\n';
                        atLineStart = true;
                        return;
                    }
                    const content = atLineStart ? part.replace(/^[ \t]+/, '') : part;
                    if (!content) {
                        return;
                    }
                    indentIfNeeded();
                    result += content;
                    atLineStart = false;
                });
                return;
            }

            if (token.type === 'comment') {
                ensureNewline();
                writeIndent(depth);
                result += token.value;
                atLineStart = false;
                ensureNewline();
                return;
            }

            const isInline = token.inline;

            if (token.type === 'close') {
                if (!isInline) {
                    depth = Math.max(0, depth - 1);
                    ensureNewline();
                    writeIndent(depth);
                    result += token.value;
                    atLineStart = false;
                    ensureNewline();
                } else {
                    indentIfNeeded();
                    result += token.value;
                    atLineStart = false;
                }
                return;
            }

            if (token.type === 'void') {
                if (!isInline) {
                    ensureNewline();
                    writeIndent(depth);
                    result += token.value;
                    atLineStart = false;
                    ensureNewline();
                } else {
                    indentIfNeeded();
                    result += token.value;
                    atLineStart = false;
                }
                return;
            }

            // open
            if (!isInline) {
                ensureNewline();
                writeIndent(depth);
                result += token.value;
                atLineStart = false;
                depth++;
                if (!PRESERVE_TAGS[token.name]) {
                    ensureNewline();
                }
            } else {
                indentIfNeeded();
                result += token.value;
                atLineStart = false;
            }
        });

        const trimmed = result.replace(/\s+$/, '');
        return trimmed ? trimmed + '\n' : '';
    }

    /**
     * @param {HTMLTextAreaElement} textarea
     * @param {Object} options
     */
    function HtmlEditor(textarea, options) {
        this.textarea = textarea;
        this.options = options || {};
        this.id = textarea.id || ('editor-' + Math.random().toString(36).slice(2, 9));

        if (!textarea.id) {
            textarea.id = this.id;
        }

        this.sourceMode = false;
        this.sourceWrap = null;
        this.sourceGutter = null;
        this.sourceHighlight = null;
        this.sourceHighlightCode = null;
        this.sourceGroup = null;
        this.sourceRenderFrame = null;
        this.sourceObserver = null;
        this.fileBrowser = options.fileBrowser || null;
        this.imageDialogOpen = false;
        this.imageBrowseEmbedded = false;
        this.editingImage = null;
        this.linkDialogOpen = false;
        this.linkBrowseEmbedded = false;
        this.editingLink = null;
        this.editingTable = null;
        this.editingCells = null;
        this.tableDropdown = null;
        this.savedSelection = null;
        this.selectedImage = null;
        this.statusBar = null;
        this.statusPath = '';
        this.history = [];
        this.historyIndex = -1;
        this.historyTimer = null;
        this.historyApplying = false;
        this.destroyed = false;
        this.explicitDivs = new WeakSet();
        this.form = null;
        this.onSubmit = null;
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onBeforeInput = this.onBeforeInput.bind(this);
        this.onSourceKeyDown = this.onSourceKeyDown.bind(this);
        this.onSourceInput = this.onSourceInput.bind(this);
        this.onSourceScroll = this.onSourceScroll.bind(this);

        window.BrammoEditor.instances[this.id] = this;
        this.init();
    }

    HtmlEditor.prototype.init = function() {
        const labels = this.options.labels || {};
        const wrapper = document.createElement('div');
        wrapper.className = 'html-editor';
        wrapper.style.setProperty('--html-editor-height', (this.options.height || 500) + 'px');
        this.textarea.parentNode.insertBefore(wrapper, this.textarea);
        wrapper.appendChild(this.textarea);

        this.imageTarget = document.createElement('div');
        this.imageTarget.id = 'editor-img-target-' + this.id;
        this.imageTarget.dataset.editorId = this.id;
        this.imageTarget.hidden = true;
        wrapper.appendChild(this.imageTarget);

        this.linkTarget = document.createElement('div');
        this.linkTarget.id = 'editor-link-target-' + this.id;
        this.linkTarget.dataset.editorId = this.id;
        this.linkTarget.dataset.editorLinkTarget = '1';
        this.linkTarget.hidden = true;
        wrapper.appendChild(this.linkTarget);

        if (this.options.statusBar !== false) {
            wrapper.classList.add('has-statusbar');
            this.statusBar = document.createElement('div');
            this.statusBar.className = 'html-editor-statusbar';
            this.statusBar.setAttribute('aria-live', 'polite');
            this.statusBar.setAttribute('aria-label', labels.elementPath || '');
            wrapper.appendChild(this.statusBar);
        }

        this.toolbar = this.buildToolbar();
        wrapper.insertBefore(this.toolbar, this.textarea);

        this.body = document.createElement('div');
        this.body.className = 'html-editor-body';
        this.body.contentEditable = 'true';
        this.body.innerHTML = this.textarea.value;
        this.body.setAttribute('role', 'textbox');
        this.body.setAttribute('aria-multiline', 'true');
        wrapper.insertBefore(this.body, this.textarea);

        this.sourceWrap = document.createElement('div');
        this.sourceWrap.className = 'html-editor-source-wrap';
        this.sourceWrap.hidden = true;

        this.sourceGutter = document.createElement('div');
        this.sourceGutter.className = 'html-editor-gutter';
        this.sourceGutter.setAttribute('aria-hidden', 'true');
        this.sourceWrap.appendChild(this.sourceGutter);

        const sourceInner = document.createElement('div');
        sourceInner.className = 'html-editor-source-inner';

        this.sourceHighlight = document.createElement('pre');
        this.sourceHighlight.className = 'html-editor-highlight';
        this.sourceHighlight.setAttribute('aria-hidden', 'true');
        this.sourceHighlightCode = document.createElement('code');
        this.sourceHighlight.appendChild(this.sourceHighlightCode);
        sourceInner.appendChild(this.sourceHighlight);

        this.textarea.classList.add('html-editor-source');
        this.textarea.spellcheck = false;
        this.textarea.setAttribute('aria-hidden', 'true');
        sourceInner.appendChild(this.textarea);
        this.sourceWrap.appendChild(sourceInner);
        wrapper.insertBefore(this.sourceWrap, this.body.nextSibling);

        this.textarea.addEventListener('input', this.onSourceInput);
        this.textarea.addEventListener('scroll', this.onSourceScroll);
        this.textarea.addEventListener('keydown', this.onSourceKeyDown);

        if (typeof ResizeObserver !== 'undefined') {
            this.sourceObserver = new ResizeObserver(function() {
                if (this.sourceMode) {
                    this.scheduleSourceRender();
                }
            }.bind(this));
            this.sourceObserver.observe(this.textarea);
        }

        this.body.addEventListener('focus', function() {
            this.setDefaultBlock();
        }.bind(this));
        this.body.addEventListener('compositionstart', function() {
            this.ensureParagraph();
        }.bind(this));
        this.body.addEventListener('input', function() {
            this.sync();
            if (!this.historyApplying) {
                this.scheduleHistoryCommit();
            }
            this.refreshToolbarState();
        }.bind(this));
        this.body.addEventListener('blur', function() {
            this.commitHistory();
            this.sync();
        }.bind(this));
        this.body.addEventListener('keyup', this.refreshToolbarState.bind(this));
        this.body.addEventListener('keydown', this.onKeyDown);
        this.body.addEventListener('beforeinput', this.onBeforeInput);
        this.body.addEventListener('mouseup', function() {
            this.trackSelectedImage();
            this.refreshToolbarState();
        }.bind(this));
        this.body.addEventListener('click', function(e) {
            const img = e.target.closest('img');
            if (img && this.body.contains(img)) {
                this.selectedImage = img;
            }
        }.bind(this));
        this.body.addEventListener('dblclick', function(e) {
            if (this.sourceMode) {
                return;
            }
            const link = e.target.closest('a');
            if (link && this.body.contains(link)) {
                e.preventDefault();
                this.openLinkDialog(link);
                return;
            }
            const img = e.target.closest('img');
            if (img && this.body.contains(img)) {
                e.preventDefault();
                this.openImageDialog(img);
            }
        }.bind(this));

        if (this.options.cleanOnPaste !== false) {
            this.body.addEventListener('paste', this.onPaste.bind(this));
        }

        this.onSelectionChange = this.onSelectionChange.bind(this);
        document.addEventListener('selectionchange', this.onSelectionChange);

        this.form = this.textarea.closest('form');
        if (this.form) {
            this.onSubmit = this.sync.bind(this);
            this.form.addEventListener('submit', this.onSubmit);
        }

        this.setDefaultBlock();
        this.historyReset();
        this.refreshToolbarState();
    };

    /**
     * @returns {HTMLElement}
     */
    HtmlEditor.prototype.buildToolbar = function() {
        const labels = this.options.labels || {};
        const toolbar = document.createElement('div');
        toolbar.className = 'html-editor-toolbar btn-toolbar flex-wrap gap-1';
        toolbar.setAttribute('role', 'toolbar');

        toolbar.appendChild(this.buildButtonGroup([
            { action: 'undo', icon: 'bi-arrow-counterclockwise', title: labels.undo },
            { action: 'redo', icon: 'bi-arrow-clockwise', title: labels.redo },
        ]));
        toolbar.appendChild(this.buildBlockSelect(labels));
        toolbar.appendChild(this.buildButtonGroup([
            { cmd: 'bold', icon: 'bi-type-bold', title: labels.bold },
            { cmd: 'italic', icon: 'bi-type-italic', title: labels.italic },
            { cmd: 'underline', icon: 'bi-type-underline', title: labels.underline },
            { cmd: 'strikeThrough', icon: 'bi-type-strikethrough', title: labels.strikethrough },
            { cmd: 'subscript', icon: 'bi-subscript', title: labels.subscript },
            { cmd: 'superscript', icon: 'bi-superscript', title: labels.superscript },
            { action: 'wrapCode', icon: 'bi-code', title: labels.code },
        ]));
        toolbar.appendChild(this.buildButtonGroup([
            { action: 'alignLeft', icon: 'bi-text-left', title: labels.alignLeft },
            { action: 'alignCenter', icon: 'bi-text-center', title: labels.alignCenter },
            { action: 'alignRight', icon: 'bi-text-right', title: labels.alignRight },
            { action: 'alignJustify', icon: 'bi-justify', title: labels.alignJustify },
        ]));
        toolbar.appendChild(this.buildButtonGroup([
            { cmd: 'insertUnorderedList', icon: 'bi-list-ul', title: labels.unorderedList },
            { cmd: 'insertOrderedList', icon: 'bi-list-ol', title: labels.orderedList },
        ]));
        toolbar.appendChild(this.buildButtonGroup([
            { action: 'insertLink', icon: 'bi-link-45deg', title: labels.link },
            { action: 'insertImage', icon: 'bi-image', title: labels.imageBrowse },
        ]));
        toolbar.appendChild(this.buildTableMenu(labels));
        toolbar.appendChild(this.buildButtonGroup([
            { action: 'clearFormat', icon: 'bi-eraser', title: labels.clearFormat },
        ]));
        toolbar.appendChild(this.buildButtonGroup([
            { action: 'toggleSource', icon: 'bi-code-slash', title: labels.source },
        ]));
        this.sourceGroup = this.buildButtonGroup([
            { action: 'formatSource', icon: 'bi-braces', title: labels.formatSource },
        ]);
        this.sourceGroup.classList.add('d-none');
        toolbar.appendChild(this.sourceGroup);

        return toolbar;
    };

    /**
     * @param {Object} labels
     * @returns {HTMLElement}
     */
    HtmlEditor.prototype.buildBlockSelect = function(labels) {
        const group = document.createElement('div');
        group.className = 'btn-group btn-group-sm me-1';

        const select = document.createElement('select');
        select.className = 'form-select form-select-sm html-editor-block-select';
        select.title = labels.blockFormat || '';

        const blocks = [
            ['p', labels.paragraph],
            ['h1', labels.heading1],
            ['h2', labels.heading2],
            ['h3', labels.heading3],
            ['h4', labels.heading4],
            ['h5', labels.heading5],
            ['h6', labels.heading6],
            ['div', labels.div],
            ['blockquote', labels.blockquote],
            ['pre', labels.pre],
        ];

        blocks.forEach(function(block) {
            const option = document.createElement('option');
            option.value = block[0];
            option.textContent = block[1] || block[0];
            select.appendChild(option);
        });

        const self = this;
        select.addEventListener('change', function() {
            self.focusBody();
            self.setDefaultBlock();
            document.execCommand('formatBlock', false, '<' + select.value + '>');
            if (select.value === 'div') {
                const block = self.getBlockElement();
                if (block && block.nodeName === 'DIV') {
                    self.explicitDivs.add(block);
                }
            }
            self.sync();
            self.commitHistory();
            self.refreshToolbarState();
        });

        this.blockSelect = select;
        group.appendChild(select);
        return group;
    };

    /**
     * @param {Array<Object>} buttons
     * @returns {HTMLElement}
     */
    HtmlEditor.prototype.buildButtonGroup = function(buttons) {
        const group = document.createElement('div');
        group.className = 'btn-group btn-group-sm me-1';

        const self = this;
        buttons.forEach(function(btn) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-secondary';
            button.title = btn.title || '';
            button.innerHTML = '<i class="bi ' + btn.icon + '"></i>';

            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (btn.cmd) {
                    self.execCommand(btn.cmd);
                } else if (btn.action) {
                    self.handleAction(btn.action);
                }
            });

            if (btn.cmd) {
                button.dataset.cmd = btn.cmd;
            }

            if (btn.action) {
                button.dataset.action = btn.action;
            }

            group.appendChild(button);
        });

        return group;
    };

    /**
     * @param {Object} labels
     * @returns {HTMLElement}
     */
    HtmlEditor.prototype.buildTableMenu = function(labels) {
        const group = document.createElement('div');
        group.className = 'btn-group btn-group-sm me-1';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn btn-outline-secondary dropdown-toggle';
        toggle.dataset.bsToggle = 'dropdown';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.title = labels.table || 'Table';
        toggle.dataset.action = 'tableMenu';
        toggle.innerHTML = '<i class="bi bi-table"></i>';
        group.appendChild(toggle);

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu html-editor-table-menu p-2';
        menu.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });

        const gridWrap = document.createElement('div');
        gridWrap.className = 'html-editor-table-grid-wrap';

        const gridCaption = document.createElement('div');
        gridCaption.className = 'html-editor-table-grid-caption text-muted small mb-1';
        gridCaption.textContent = '0 x 0';

        const grid = document.createElement('div');
        grid.className = 'html-editor-table-grid';
        grid.setAttribute('role', 'grid');

        const self = this;

        for (let row = 1; row <= TABLE_GRID_SIZE; row++) {
            for (let col = 1; col <= TABLE_GRID_SIZE; col++) {
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'html-editor-table-grid-cell';
                cell.dataset.row = String(row);
                cell.dataset.col = String(col);
                cell.setAttribute('aria-label', row + ' x ' + col);
                cell.addEventListener('mouseenter', function() {
                    gridCaption.textContent = row + ' x ' + col;
                    grid.querySelectorAll('.html-editor-table-grid-cell').forEach(function(el) {
                        const r = parseInt(el.dataset.row, 10);
                        const c = parseInt(el.dataset.col, 10);
                        el.classList.toggle('is-active', r <= row && c <= col);
                    });
                });
                cell.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.restoreSavedSelection();
                    self.insertTable(row, col, {
                        tableClass: self.options.tableClass || '',
                    });
                    if (self.tableDropdown) {
                        self.tableDropdown.hide();
                    }
                });
                grid.appendChild(cell);
            }
        }

        grid.addEventListener('mouseleave', function() {
            gridCaption.textContent = '0 x 0';
            grid.querySelectorAll('.html-editor-table-grid-cell.is-active').forEach(function(el) {
                el.classList.remove('is-active');
            });
        });

        gridWrap.appendChild(gridCaption);
        gridWrap.appendChild(grid);
        menu.appendChild(gridWrap);
        this.tableGridWrap = gridWrap;

        const actions = [
            { action: 'tableProperties', label: labels.tableProperties || 'Table properties' },
            { action: 'insertRowAbove', label: labels.insertRowAbove || 'Insert row above' },
            { action: 'insertRowBelow', label: labels.insertRowBelow || 'Insert row below' },
            { action: 'insertColumnLeft', label: labels.insertColumnLeft || 'Insert column left' },
            { action: 'insertColumnRight', label: labels.insertColumnRight || 'Insert column right' },
            { action: 'deleteRow', label: labels.deleteRow || 'Delete row' },
            { action: 'deleteColumn', label: labels.deleteColumn || 'Delete column' },
            { action: 'deleteTable', label: labels.deleteTable || 'Delete table' },
            { action: 'mergeCells', label: labels.mergeCells || 'Merge cells' },
            { action: 'splitCell', label: labels.splitCell || 'Split cell' },
            { action: 'cellProperties', label: labels.cellProperties || 'Cell properties' },
        ];

        actions.forEach(function(item) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dropdown-item html-editor-table-action';
            btn.dataset.tableAction = item.action;
            btn.textContent = item.label;
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.restoreSavedSelection();
                self.handleTableAction(item.action);
                if (self.tableDropdown) {
                    self.tableDropdown.hide();
                }
            });
            menu.appendChild(btn);
        });

        group.appendChild(menu);
        this.tableMenu = menu;

        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
            this.tableDropdown = new bootstrap.Dropdown(toggle);
            toggle.addEventListener('show.bs.dropdown', function() {
                self.saveSelection();
                self.refreshTableMenuState();
            });
        } else {
            toggle.addEventListener('click', function() {
                self.saveSelection();
                self.refreshTableMenuState();
            });
        }

        return group;
    };

    HtmlEditor.prototype.focusBody = function() {
        if (!this.sourceMode) {
            this.body.focus();
        }
    };

    /**
     * @param {Node} node
     * @param {number} offset
     * @returns {number}
     */
    HtmlEditor.prototype.offsetFromNode = function(node, offset) {
        if (!node || !this.body.contains(node)) {
            return 0;
        }

        try {
            const range = document.createRange();
            range.selectNodeContents(this.body);
            range.setEnd(node, offset);
            return range.toString().length;
        } catch (e) {
            return 0;
        }
    };

    /**
     * @param {number} target
     * @returns {{node: Node, offset: number}|null}
     */
    HtmlEditor.prototype.nodeFromOffset = function(target) {
        if (target <= 0) {
            return { node: this.body, offset: 0 };
        }

        const walker = document.createTreeWalker(this.body, NodeFilter.SHOW_TEXT);
        let remaining = target;
        let node = walker.nextNode();
        let last = null;

        while (node) {
            last = node;
            const length = node.nodeValue ? node.nodeValue.length : 0;
            if (remaining <= length) {
                return { node: node, offset: remaining };
            }
            remaining -= length;
            node = walker.nextNode();
        }

        if (last) {
            return { node: last, offset: last.nodeValue ? last.nodeValue.length : 0 };
        }

        return { node: this.body, offset: this.body.childNodes.length };
    };

    /**
     * @returns {{start: number, end: number}|null}
     */
    HtmlEditor.prototype.getSelectionOffsets = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        const range = selection.getRangeAt(0);
        if (!this.body.contains(range.commonAncestorContainer)) {
            return null;
        }

        return {
            start: this.offsetFromNode(range.startContainer, range.startOffset),
            end: this.offsetFromNode(range.endContainer, range.endOffset),
        };
    };

    /**
     * @param {{start: number, end: number}|null} offsets
     */
    HtmlEditor.prototype.restoreSelectionOffsets = function(offsets) {
        if (!offsets) {
            return;
        }

        const start = this.nodeFromOffset(offsets.start);
        const end = this.nodeFromOffset(offsets.end);
        if (!start || !end) {
            return;
        }

        try {
            const range = document.createRange();
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } catch (e) {
            // Ignore invalid restored ranges.
        }
    };

    /**
     * @returns {{html: string, selection: ({start: number, end: number}|null)}}
     */
    HtmlEditor.prototype.captureHistoryEntry = function() {
        return {
            html: this.body.innerHTML,
            selection: this.getSelectionOffsets(),
        };
    };

    HtmlEditor.prototype.historyReset = function() {
        this.cancelHistoryCommit();
        this.history = [this.captureHistoryEntry()];
        this.historyIndex = 0;
        this.refreshHistoryButtons();
    };

    HtmlEditor.prototype.cancelHistoryCommit = function() {
        if (this.historyTimer) {
            clearTimeout(this.historyTimer);
            this.historyTimer = null;
        }
    };

    HtmlEditor.prototype.scheduleHistoryCommit = function() {
        this.cancelHistoryCommit();
        this.historyTimer = setTimeout(function() {
            this.historyTimer = null;
            this.commitHistory();
        }.bind(this), HISTORY_DEBOUNCE);
    };

    HtmlEditor.prototype.commitHistory = function() {
        if (this.historyApplying || this.sourceMode || this.destroyed) {
            return;
        }

        this.cancelHistoryCommit();

        const entry = this.captureHistoryEntry();
        const current = this.history[this.historyIndex];
        if (current && current.html === entry.html) {
            if (current) {
                current.selection = entry.selection;
            }
            this.refreshHistoryButtons();
            return;
        }

        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(entry);
        this.historyIndex = this.history.length - 1;

        while (this.history.length > HISTORY_LIMIT) {
            this.history.shift();
            this.historyIndex--;
        }

        this.refreshHistoryButtons();
    };

    /**
     * @param {{html: string, selection: ({start: number, end: number}|null)}} entry
     */
    HtmlEditor.prototype.applyHistory = function(entry) {
        this.historyApplying = true;
        this.cancelHistoryCommit();

        this.body.innerHTML = entry.html;
        this.selectedImage = null;
        this.editingImage = null;
        this.editingLink = null;
        this.editingTable = null;
        this.editingCells = null;
        this.clearSavedSelection();
        this.statusPath = '';

        this.focusBody();
        this.restoreSelectionOffsets(entry.selection);
        this.sync();
        this.historyApplying = false;
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.historyUndo = function() {
        if (this.sourceMode || this.historyIndex <= 0) {
            return;
        }

        this.cancelHistoryCommit();
        this.historyIndex--;
        this.applyHistory(this.history[this.historyIndex]);
    };

    HtmlEditor.prototype.historyRedo = function() {
        if (this.sourceMode || this.historyIndex >= this.history.length - 1) {
            return;
        }

        this.cancelHistoryCommit();
        this.historyIndex++;
        this.applyHistory(this.history[this.historyIndex]);
    };

    HtmlEditor.prototype.refreshHistoryButtons = function() {
        if (!this.toolbar) {
            return;
        }

        const undoBtn = this.toolbar.querySelector('button[data-action="undo"]');
        const redoBtn = this.toolbar.querySelector('button[data-action="redo"]');
        const canUndo = !this.sourceMode && this.historyIndex > 0;
        const canRedo = !this.sourceMode && this.historyIndex < this.history.length - 1;

        if (undoBtn) {
            undoBtn.disabled = !canUndo;
        }
        if (redoBtn) {
            redoBtn.disabled = !canRedo;
        }
    };

    /**
     * @param {KeyboardEvent} e
     */
    HtmlEditor.prototype.onKeyDown = function(e) {
        if (this.sourceMode || this.destroyed) {
            return;
        }

        this.setDefaultBlock();
        if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'Enter' || e.key.length === 1)) {
            this.ensureParagraph();
        }

        if (e.key === 'Tab' && !(e.ctrlKey || e.metaKey || e.altKey)) {
            const cell = this.getCellAtSelection();
            if (cell) {
                e.preventDefault();
                this.navigateTableCell(e.shiftKey ? -1 : 1);
                return;
            }
        }

        if (!(e.ctrlKey || e.metaKey) || e.altKey) {
            return;
        }

        const key = (e.key || '').toLowerCase();
        if (key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.historyRedo();
            } else {
                this.historyUndo();
            }
        } else if (key === 'y') {
            e.preventDefault();
            this.historyRedo();
        }
    };

    /**
     * @param {InputEvent} e
     */
    HtmlEditor.prototype.onBeforeInput = function(e) {
        if (this.sourceMode || this.destroyed) {
            return;
        }

        if (e.inputType === 'historyUndo') {
            e.preventDefault();
            this.historyUndo();
            return;
        }
        if (e.inputType === 'historyRedo') {
            e.preventDefault();
            this.historyRedo();
            return;
        }

        if (
            e.inputType === 'insertText' ||
            e.inputType === 'insertCompositionText' ||
            e.inputType === 'insertReplacementText' ||
            e.inputType === 'insertParagraph' ||
            e.inputType === 'insertLineBreak'
        ) {
            this.ensureParagraph();
        }
    };

    /**
     * Use paragraphs for new lines created by the browser.
     */
    HtmlEditor.prototype.setDefaultBlock = function() {
        document.execCommand('defaultParagraphSeparator', false, 'p');
    };

    /**
     * Put the caret in a paragraph before text is inserted on an empty line.
     * An explicit Div block from the toolbar is left as-is.
     */
    HtmlEditor.prototype.ensureParagraph = function() {
        if (this.sourceMode || this.destroyed) {
            return;
        }

        this.setDefaultBlock();

        const block = this.getBlockElement();
        if (block) {
            if (
                block.nodeName === 'DIV' &&
                block.parentNode === this.body &&
                !this.explicitDivs.has(block) &&
                this.isEmptyBlock(block)
            ) {
                document.execCommand('formatBlock', false, '<p>');
            }
            return;
        }

        if (this.caretIsInEditorRoot()) {
            document.execCommand('formatBlock', false, '<p>');
        }
    };

    /**
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    HtmlEditor.prototype.isEmptyBlock = function(el) {
        const text = (el.textContent || '').replace(/\u00a0/g, '').trim();
        return text === '' && !el.querySelector('img, hr, table, ul, ol');
    };

    /**
     * True when the caret is in the editor body and not inside a block, cell, or list item.
     *
     * @returns {boolean}
     */
    HtmlEditor.prototype.caretIsInEditorRoot = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return false;
        }

        let node = selection.anchorNode;
        if (!node || (node !== this.body && !this.body.contains(node))) {
            return false;
        }

        if (node === this.body) {
            return true;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        while (node && node !== this.body) {
            if (BLOCK_TAGS.includes(node.nodeName) || node.nodeName === 'TD' || node.nodeName === 'TH') {
                return false;
            }
            node = node.parentNode;
        }

        return node === this.body;
    };

    /**
     * @param {string} cmd
     */
    HtmlEditor.prototype.execCommand = function(cmd) {
        this.focusBody();
        document.execCommand(cmd, false, null);
        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @param {string} action
     */
    HtmlEditor.prototype.handleAction = function(action) {
        if (ALIGN_ACTIONS[action]) {
            this.setTextAlign(ALIGN_ACTIONS[action]);
            return;
        }

        switch (action) {
            case 'undo':
                this.historyUndo();
                break;
            case 'redo':
                this.historyRedo();
                break;
            case 'wrapCode':
                this.wrapCode();
                break;
            case 'insertLink':
                this.openLinkDialog();
                break;
            case 'insertImage':
                this.openImageDialog();
                break;
            case 'clearFormat':
                this.clearFormatting();
                break;
            case 'toggleSource':
                this.toggleSource();
                break;
            case 'formatSource':
                this.formatSource();
                break;
        }
    };

    /**
     * @param {string} action
     */
    HtmlEditor.prototype.handleTableAction = function(action) {
        switch (action) {
            case 'tableProperties':
                this.openTableDialog();
                break;
            case 'insertRowAbove':
                this.insertTableRow(true);
                break;
            case 'insertRowBelow':
                this.insertTableRow(false);
                break;
            case 'insertColumnLeft':
                this.insertTableColumn(true);
                break;
            case 'insertColumnRight':
                this.insertTableColumn(false);
                break;
            case 'deleteRow':
                this.deleteTableRow();
                break;
            case 'deleteColumn':
                this.deleteTableColumn();
                break;
            case 'deleteTable':
                this.deleteTable();
                break;
            case 'mergeCells':
                this.mergeCells();
                break;
            case 'splitCell':
                this.splitCell();
                break;
            case 'cellProperties':
                this.openCellDialog();
                break;
        }
    };

    /**
     * @returns {HTMLElement|null}
     */
    HtmlEditor.prototype.getAlignmentBlock = function() {
        const blocks = this.getAlignmentBlocks();
        return blocks.length ? blocks[0] : null;
    };

    /**
     * Innermost block elements intersecting the current selection.
     *
     * @returns {Array<HTMLElement>}
     */
    HtmlEditor.prototype.getAlignmentBlocks = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return [];
        }

        const range = selection.getRangeAt(0);
        if (!this.body.contains(range.commonAncestorContainer)) {
            return [];
        }

        const candidates = Array.prototype.slice.call(
            this.body.querySelectorAll(BLOCK_TAGS.join(','))
        );
        const intersecting = candidates.filter(function(el) {
            try {
                return range.intersectsNode(el);
            } catch (e) {
                return false;
            }
        });

        return intersecting.filter(function(el) {
            return !intersecting.some(function(other) {
                return other !== el && el.contains(other);
            });
        });
    };

    /**
     * @param {HTMLElement} block
     * @returns {string}
     */
    HtmlEditor.prototype.getBlockTextAlign = function(block) {
        if (block.style.textAlign) {
            return block.style.textAlign;
        }

        const alignAttr = block.getAttribute('align');
        return alignAttr ? alignAttr.toLowerCase() : '';
    };

    /**
     * @returns {string}
     */
    HtmlEditor.prototype.getCurrentTextAlign = function() {
        const blocks = this.getAlignmentBlocks();
        if (!blocks.length) {
            return '';
        }

        const first = this.getBlockTextAlign(blocks[0]);
        for (let i = 1; i < blocks.length; i++) {
            if (this.getBlockTextAlign(blocks[i]) !== first) {
                return '';
            }
        }

        return first;
    };

    /**
     * @param {string} align
     */
    HtmlEditor.prototype.setTextAlign = function(align) {
        this.focusBody();
        const blocks = this.getAlignmentBlocks();
        if (!blocks.length) {
            return;
        }

        const allMatch = blocks.every(function(block) {
            return this.getBlockTextAlign(block) === align;
        }.bind(this));

        blocks.forEach(function(block) {
            block.removeAttribute('align');

            if (allMatch) {
                block.style.removeProperty('text-align');
                if (!block.style.length) {
                    block.removeAttribute('style');
                }
            } else {
                block.style.textAlign = align;
            }
        });

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.wrapCode = function() {
        if (this.sourceMode) {
            return;
        }

        this.focusBody();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const existing = this.getCodeAtSelection();
        if (existing) {
            const parent = existing.parentNode;
            this.unwrapNode(existing);
            if (parent) {
                parent.normalize();
            }
            this.sync();
            this.commitHistory();
            this.refreshToolbarState();
            return;
        }

        const range = selection.getRangeAt(0);
        if (range.collapsed || !this.body.contains(range.commonAncestorContainer)) {
            return;
        }

        const code = document.createElement('code');
        try {
            range.surroundContents(code);
        } catch (e) {
            code.appendChild(range.extractContents());
            range.insertNode(code);
        }

        const selectRange = document.createRange();
        selectRange.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(selectRange);

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @param {ClipboardEvent} e
     */
    HtmlEditor.prototype.onPaste = function(e) {
        if (this.sourceMode) {
            return;
        }

        const clipboard = e.clipboardData;
        if (!clipboard) {
            return;
        }

        e.preventDefault();

        const html = clipboard.getData('text/html');
        const text = clipboard.getData('text/plain');
        let cleaned;

        if (html) {
            cleaned = this.cleanHtml(html);
        } else if (text) {
            cleaned = this.plainTextToHtml(text);
        } else {
            return;
        }

        this.focusBody();
        document.execCommand('insertHTML', false, cleaned);
        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * Wrap pasted plain text in paragraphs. Each line becomes a <p>.
     * A single line pasted into an existing block stays inline.
     *
     * @param {string} text
     * @returns {string}
     */
    HtmlEditor.prototype.plainTextToHtml = function(text) {
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
        const lines = normalized.split('\n');
        const block = this.getBlockElement();

        if (lines.length === 1 && block) {
            return this.escapeText(lines[0]);
        }

        const self = this;
        return lines.map(function(line) {
            const content = line === '' ? '<br>' : self.escapeText(line);
            return '<p>' + content + '</p>';
        }).join('');
    };

    /**
     * Block element that contains the caret, when one exists inside the editor.
     *
     * @returns {HTMLElement|null}
     */
    HtmlEditor.prototype.getBlockElement = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        let node = selection.anchorNode;
        if (!node || !this.body.contains(node)) {
            return null;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        while (node && node !== this.body) {
            if (BLOCK_TAGS.includes(node.nodeName)) {
                return node;
            }
            node = node.parentNode;
        }

        return null;
    };

    /**
     * @param {string} text
     * @returns {string}
     */
    HtmlEditor.prototype.escapeText = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * @param {string} html
     * @returns {string}
     */
    HtmlEditor.prototype.cleanHtml = function(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        this.cleanFragment(template.content);
        return template.innerHTML;
    };

    /**
     * Clean a DocumentFragment or Element in place.
     *
     * @param {DocumentFragment|Element} root
     */
    HtmlEditor.prototype.cleanFragment = function(root) {
        const self = this;
        const children = Array.prototype.slice.call(root.childNodes);

        children.forEach(function(node) {
            self.cleanNode(node);
        });
    };

    /**
     * @param {Node} node
     */
    HtmlEditor.prototype.cleanNode = function(node) {
        if (node.nodeType === Node.COMMENT_NODE) {
            node.parentNode.removeChild(node);
            return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = node.nodeValue.replace(/\u00a0/g, ' ');
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
            return;
        }

        const tag = node.nodeName.toUpperCase();

        if (CLEAN_DROP_TAGS[tag] || tag === 'O:P') {
            node.parentNode.removeChild(node);
            return;
        }

        const childNodes = Array.prototype.slice.call(node.childNodes);
        const self = this;
        childNodes.forEach(function(child) {
            self.cleanNode(child);
        });

        if (!CLEAN_KEEP_TAGS[tag]) {
            this.promoteInlineStyles(node);
            this.unwrapNode(node);
            return;
        }

        this.stripAttributes(node);

        if (this.isEmptyCleanable(node)) {
            node.parentNode.removeChild(node);
        }
    };

    /**
     * Promote font-weight / font-style / text-decoration on span/font to semantic tags
     * before unwrapping.
     *
     * @param {Element} el
     */
    HtmlEditor.prototype.promoteInlineStyles = function(el) {
        const style = el.style;
        if (!style) {
            return;
        }

        const wrappers = [];
        const weight = (style.fontWeight || '').toString().toLowerCase();
        if (weight === 'bold' || weight === 'bolder' || parseInt(weight, 10) >= 600) {
            wrappers.push('strong');
        }

        const fontStyle = (style.fontStyle || '').toString().toLowerCase();
        if (fontStyle === 'italic' || fontStyle === 'oblique') {
            wrappers.push('em');
        }

        const decoration = (style.textDecoration || style.textDecorationLine || '').toString().toLowerCase();
        if (decoration.indexOf('underline') !== -1) {
            wrappers.push('u');
        }
        if (decoration.indexOf('line-through') !== -1) {
            wrappers.push('s');
        }

        if (!wrappers.length) {
            return;
        }

        let parent = el;
        wrappers.forEach(function(tagName) {
            const wrapper = document.createElement(tagName);
            while (parent.firstChild) {
                wrapper.appendChild(parent.firstChild);
            }
            parent.appendChild(wrapper);
        });
    };

    /**
     * @param {Element} el
     */
    HtmlEditor.prototype.unwrapNode = function(el) {
        const parent = el.parentNode;
        if (!parent) {
            return;
        }

        while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    };

    /**
     * @param {Element} el
     */
    HtmlEditor.prototype.stripAttributes = function(el) {
        const tag = el.nodeName.toUpperCase();
        const allowed = CLEAN_ATTRS[tag] || {};
        let keptWidth = '';
        let keptHeight = '';
        let keptStyles = '';

        if (tag === 'IMG') {
            keptWidth = el.style.width || '';
            keptHeight = el.style.height || '';
        }

        if (allowed.style && el.style && el.style.length) {
            const parts = [];
            for (let i = 0; i < el.style.length; i++) {
                const name = el.style[i];
                if (TABLE_STYLE_WHITELIST[name]) {
                    parts.push(name + ': ' + el.style.getPropertyValue(name));
                }
            }
            keptStyles = parts.join('; ');
        }

        const attrs = Array.prototype.slice.call(el.attributes);
        attrs.forEach(function(attr) {
            const name = attr.name.toLowerCase();
            if (!allowed[name]) {
                el.removeAttribute(attr.name);
            }
        });

        if (tag === 'IMG') {
            const parts = [];
            if (keptWidth) {
                parts.push('width: ' + keptWidth);
            }
            if (keptHeight) {
                parts.push('height: ' + keptHeight);
            }
            if (parts.length) {
                el.style.cssText = parts.join('; ');
            }
        } else if (allowed.style) {
            if (keptStyles) {
                el.style.cssText = keptStyles;
            } else {
                el.removeAttribute('style');
            }
        }
    };

    /**
     * @param {Element} el
     * @returns {boolean}
     */
    HtmlEditor.prototype.isEmptyCleanable = function(el) {
        const tag = el.nodeName.toUpperCase();
        if (tag === 'BR' || tag === 'IMG' || tag === 'HR') {
            return false;
        }

        if (tag === 'TD' || tag === 'TH' || tag === 'TABLE' || tag === 'CAPTION' || tag === 'COL' || tag === 'COLGROUP') {
            return false;
        }

        return !el.textContent.trim() && !el.querySelector('img, hr, br');
    };

    HtmlEditor.prototype.clearFormatting = function() {
        if (this.sourceMode) {
            return;
        }

        this.focusBody();
        const selection = window.getSelection();
        const labels = this.options.labels || {};

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (this.body.contains(range.commonAncestorContainer) && !range.collapsed) {
                const fragment = range.extractContents();
                this.cleanFragment(fragment);
                const first = fragment.firstChild;
                const last = fragment.lastChild;
                range.insertNode(fragment);

                if (first && last) {
                    range.setStartBefore(first);
                    range.setEndAfter(last);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

                this.sync();
                this.commitHistory();
                this.refreshToolbarState();
                return;
            }
        }

        const message = labels.clearFormatConfirm || 'Clear formatting from the entire document?';
        if (!window.confirm(message)) {
            return;
        }

        this.cleanFragment(this.body);
        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @returns {string}
     */
    HtmlEditor.prototype.getSelectedText = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return '';
        }
        return selection.toString();
    };

    HtmlEditor.prototype.saveSelection = function() {
        this.savedSelection = null;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        if (!this.body.contains(range.commonAncestorContainer)) {
            return;
        }

        this.savedSelection = range.cloneRange();
    };

    HtmlEditor.prototype.clearSavedSelection = function() {
        this.savedSelection = null;
    };

    HtmlEditor.prototype.restoreSavedSelection = function() {
        if (!this.savedSelection) {
            return;
        }

        try {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(this.savedSelection.cloneRange());
            }
        } catch (e) {
            // Ignore invalid restored ranges.
        }
    };

    /**
     * @returns {HTMLAnchorElement|null}
     */
    HtmlEditor.prototype.getLinkAtSelection = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        if (!node || !node.closest) {
            return null;
        }

        const link = node.closest('a');
        if (link && this.body.contains(link)) {
            return link;
        }

        return null;
    };

    /**
     * @param {HTMLAnchorElement} anchor
     * @returns {Object}
     */
    HtmlEditor.prototype.getLinkProperties = function(anchor) {
        return {
            url: anchor.getAttribute('href') || '',
            text: anchor.textContent || '',
            title: anchor.getAttribute('title') || '',
            target: anchor.getAttribute('target') || '',
        };
    };

    /**
     * @param {HTMLAnchorElement} anchor
     * @param {Object} props
     */
    HtmlEditor.prototype.applyLinkProperties = function(anchor, props) {
        const url = (props.url || '').trim();
        if (!url) {
            return;
        }

        anchor.href = url;

        const text = (props.text || '').trim();
        if (text) {
            anchor.textContent = text;
        } else if (!anchor.textContent) {
            anchor.textContent = url;
        }

        const title = (props.title || '').trim();
        if (title) {
            anchor.title = title;
        } else {
            anchor.removeAttribute('title');
        }

        const target = (props.target || '').trim();
        if (target) {
            anchor.target = target;
        } else {
            anchor.removeAttribute('target');
        }
    };

    /**
     * @param {Object} props
     */
    HtmlEditor.prototype.insertLinkElement = function(props) {
        const url = (props.url || '').trim();
        if (!url) {
            return;
        }

        if (this.editingLink) {
            this.applyLinkProperties(this.editingLink, props);
            this.editingLink = null;
            this.sync();
            this.commitHistory();
            this.refreshToolbarState();
            return;
        }

        this.focusBody();
        const anchor = document.createElement('a');
        this.applyLinkProperties(anchor, props);

        let range = null;
        if (this.savedSelection) {
            range = this.savedSelection.cloneRange();
            this.clearSavedSelection();
        } else {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                range = selection.getRangeAt(0).cloneRange();
            }
        }

        if (range && this.body.contains(range.commonAncestorContainer)) {
            if (!range.collapsed) {
                range.deleteContents();
            }
            range.insertNode(anchor);
            range.setStartAfter(anchor);
            range.collapse(true);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            this.body.appendChild(anchor);
        }

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @param {string} value
     * @returns {string}
     */
    HtmlEditor.prototype.normalizeCssSize = function(value) {
        value = value.trim();
        if (!value) {
            return '';
        }
        if (/^\d+(\.\d+)?$/.test(value)) {
            return value + 'px';
        }
        return value;
    };

    /**
     * @returns {HTMLImageElement|null}
     */
    HtmlEditor.prototype.getImageAtSelection = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        const range = selection.getRangeAt(0);

        if (range.startContainer.nodeName === 'IMG' && this.body.contains(range.startContainer)) {
            return range.startContainer;
        }

        if (range.endContainer.nodeName === 'IMG' && this.body.contains(range.endContainer)) {
            return range.endContainer;
        }

        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        if (!node) {
            return null;
        }

        if (node.nodeName === 'IMG' && this.body.contains(node)) {
            return node;
        }

        if (node.closest) {
            const img = node.closest('img');
            if (img && this.body.contains(img)) {
                return img;
            }
        }

        return null;
    };

    HtmlEditor.prototype.trackSelectedImage = function() {
        const img = this.getImageAtSelection();
        this.selectedImage = img || null;
    };

    /**
     * @returns {HTMLImageElement|null}
     */
    HtmlEditor.prototype.resolveEditingImage = function(img) {
        if (img && img.tagName === 'IMG') {
            return img;
        }

        return this.getImageAtSelection() || this.selectedImage;
    };

    /**
     * @param {HTMLImageElement} img
     * @returns {Object}
     */
    HtmlEditor.prototype.getImageProperties = function(img) {
        const props = {
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '',
            width: '',
            height: '',
            styles: '',
        };

        if (img.style.width) {
            props.width = img.style.width;
        } else if (img.getAttribute('width')) {
            props.width = img.getAttribute('width');
        }

        if (img.style.height) {
            props.height = img.style.height;
        } else if (img.getAttribute('height')) {
            props.height = img.getAttribute('height');
        }

        const styleParts = [];
        for (let i = 0; i < img.style.length; i++) {
            const name = img.style[i];
            if (name !== 'width' && name !== 'height') {
                styleParts.push(name + ': ' + img.style.getPropertyValue(name));
            }
        }
        props.styles = styleParts.join('; ');

        return props;
    };

    /**
     * @param {HTMLImageElement} img
     * @param {Object} props
     */
    HtmlEditor.prototype.applyImageProperties = function(img, props) {
        const src = (props.src || '').trim();
        if (!src) {
            return;
        }

        img.src = src;

        const alt = (props.alt || '').trim();
        if (alt) {
            img.alt = alt;
        } else {
            img.removeAttribute('alt');
        }

        img.removeAttribute('width');
        img.removeAttribute('height');

        const styleParts = [];
        const width = this.normalizeCssSize(props.width || '');
        const height = this.normalizeCssSize(props.height || '');
        const styles = (props.styles || '').trim().replace(/;+\s*$/, '');

        if (width) {
            styleParts.push('width: ' + width);
        }
        if (height) {
            styleParts.push('height: ' + height);
        }
        if (styles) {
            styleParts.push(styles);
        }

        if (styleParts.length) {
            img.style.cssText = styleParts.join('; ');
        } else {
            img.removeAttribute('style');
        }
    };

    /**
     * @param {Object} props
     */
    HtmlEditor.prototype.insertImageElement = function(props) {
        const src = (props.src || '').trim();
        if (!src) {
            return;
        }

        if (this.editingImage) {
            this.applyImageProperties(this.editingImage, props);
            this.editingImage = null;
            this.sync();
            this.commitHistory();
            this.refreshToolbarState();
            return;
        }

        this.focusBody();
        const img = document.createElement('img');
        this.applyImageProperties(img, props);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            this.body.appendChild(img);
        }

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.ensureImageModal = function() {
        if (window.BrammoEditor.imageModal) {
            return window.BrammoEditor.imageModal;
        }

        const labels = this.options.labels || {};
        const modalEl = document.createElement('div');
        modalEl.id = 'editor-image-modal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML =
            '<div class="modal-dialog modal-lg">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h5 class="modal-title"></h5>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                    '</div>' +
                    '<div class="html-editor-image-form">' +
                        '<form class="modal-body">' +
                            '<div class="mb-3">' +
                                '<label class="form-label html-editor-image-src-label"></label>' +
                                '<div class="input-group">' +
                                    '<input type="text" class="form-control" name="src" required>' +
                                    '<button type="button" class="btn btn-outline-secondary html-editor-image-browse-btn">' +
                                        '<i class="bi bi-folder2-open"></i> ' +
                                        '<span class="html-editor-image-browse-label"></span>' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                            '<div class="mb-3">' +
                                '<label class="form-label html-editor-image-alt-label"></label>' +
                                '<input type="text" class="form-control" name="alt">' +
                            '</div>' +
                            '<div class="row g-2 mb-3">' +
                                '<div class="col-sm-6">' +
                                    '<label class="form-label html-editor-image-width-label"></label>' +
                                    '<input type="text" class="form-control" name="width" placeholder="100">' +
                                '</div>' +
                                '<div class="col-sm-6">' +
                                    '<label class="form-label html-editor-image-height-label"></label>' +
                                    '<input type="text" class="form-control" name="height" placeholder="100">' +
                                '</div>' +
                            '</div>' +
                            '<div class="mb-0">' +
                                '<label class="form-label html-editor-image-styles-label"></label>' +
                                '<input type="text" class="form-control" name="styles" placeholder="margin: 1rem">' +
                            '</div>' +
                        '</form>' +
                        '<div class="modal-footer html-editor-image-footer">' +
                            '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"></button>' +
                            '<button type="button" class="btn btn-primary html-editor-image-insert"></button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="html-editor-image-browse-panel d-none">' +
                        '<div class="modal-body pb-0">' +
                            '<button type="button" class="btn btn-sm btn-outline-secondary html-editor-image-browse-back">' +
                                '<i class="bi bi-arrow-left"></i> ' +
                                '<span class="html-editor-image-browse-back-label"></span>' +
                            '</button>' +
                        '</div>' +
                        '<div class="html-editor-image-browse-body px-3 pb-3"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        modalEl.querySelector('.modal-title').textContent = labels.imageDialogTitle || 'Insert image';
        modalEl.querySelector('.html-editor-image-src-label').textContent = labels.imageSrc || 'URL';
        modalEl.querySelector('.html-editor-image-alt-label').textContent = labels.imageAlt || 'Alt';
        modalEl.querySelector('.html-editor-image-width-label').textContent = labels.imageWidth || 'Width';
        modalEl.querySelector('.html-editor-image-height-label').textContent = labels.imageHeight || 'Height';
        modalEl.querySelector('.html-editor-image-styles-label').textContent = labels.imageStyles || 'Styles';
        modalEl.querySelector('.html-editor-image-browse-label').textContent = labels.imageSelect || 'Select';
        modalEl.querySelector('.html-editor-image-browse-back-label').textContent = labels.imageBack || 'Back';
        modalEl.querySelector('.html-editor-image-footer .btn-secondary').textContent = labels.cancel || 'Cancel';
        modalEl.querySelector('.html-editor-image-insert').textContent = labels.imageInsert || 'Insert';

        document.body.appendChild(modalEl);

        const form = modalEl.querySelector('form');
        const formView = modalEl.querySelector('.html-editor-image-form');
        const browseView = modalEl.querySelector('.html-editor-image-browse-panel');
        const browseBtn = modalEl.querySelector('.html-editor-image-browse-btn');
        const browseBackBtn = modalEl.querySelector('.html-editor-image-browse-back');
        const insertBtn = modalEl.querySelector('.html-editor-image-insert');
        const closeBtn = modalEl.querySelector('.modal-header .btn-close');
        const modalTitle = modalEl.querySelector('.modal-title');
        const bsModal = typeof bootstrap !== 'undefined' ? new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false,
        }) : null;

        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeImageEditor;
            if (editor) {
                editor.openImagePickerForDialog();
            }
        });

        browseBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeImageEditor;
            if (editor) {
                editor.showImageFormView();
            }
        });

        closeBtn.addEventListener('click', function(e) {
            const editor = window.BrammoEditor.activeImageEditor;
            if (editor && editor.imageBrowseEmbedded) {
                e.preventDefault();
                e.stopImmediatePropagation();
                editor.showImageFormView();
            }
        });

        modalEl.addEventListener('hide.bs.modal', function(e) {
            const editor = window.BrammoEditor.activeImageEditor;
            if (editor && editor.imageBrowseEmbedded) {
                e.preventDefault();
                editor.showImageFormView();
            }
        });

        insertBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeImageEditor;
            if (!editor) {
                return;
            }

            const src = form.elements.src.value.trim();
            if (!src) {
                form.elements.src.focus();
                return;
            }

            editor.insertImageElement({
                src: src,
                alt: form.elements.alt.value,
                width: form.elements.width.value,
                height: form.elements.height.value,
                styles: form.elements.styles.value,
            });

            if (bsModal) {
                bsModal.hide();
            }
        });

        modalEl.addEventListener('hidden.bs.modal', function() {
            const editor = window.BrammoEditor.activeImageEditor;
            if (editor) {
                editor.imageDialogOpen = false;
                editor.imageBrowseEmbedded = false;
                editor.editingImage = null;
                editor.showImageFormView();
            }
            window.BrammoEditor.activeImageEditor = null;
            form.reset();
        });

        window.BrammoEditor.imageModal = {
            element: modalEl,
            form: form,
            formView: formView,
            browseView: browseView,
            browseBtn: browseBtn,
            modalTitle: modalTitle,
            insertBtn: insertBtn,
            modal: bsModal,
            browseSelector: '#editor-image-modal .html-editor-image-browse-body',
        };

        return window.BrammoEditor.imageModal;
    };

    HtmlEditor.prototype.updateImageModalLabels = function() {
        const imageModal = window.BrammoEditor.imageModal;
        if (!imageModal) {
            return;
        }

        const labels = this.options.labels || {};
        const editing = !!this.editingImage;

        imageModal.modalTitle.textContent = editing
            ? (labels.imageEditTitle || 'Edit image')
            : (labels.imageDialogTitle || 'Insert image');
        imageModal.insertBtn.textContent = editing
            ? (labels.imageSave || 'Save')
            : (labels.imageInsert || 'Insert');
    };

    HtmlEditor.prototype.openImageDialog = function(img) {
        const imageModal = this.ensureImageModal();
        window.BrammoEditor.activeImageEditor = this;
        this.imageDialogOpen = true;
        this.editingImage = this.resolveEditingImage(img);
        this.showImageFormView();
        imageModal.form.reset();

        if (this.editingImage) {
            const props = this.getImageProperties(this.editingImage);
            imageModal.form.elements.src.value = props.src;
            imageModal.form.elements.alt.value = props.alt;
            imageModal.form.elements.width.value = props.width;
            imageModal.form.elements.height.value = props.height;
            imageModal.form.elements.styles.value = props.styles;
        }

        this.updateImageModalLabels();
        if (imageModal.browseBtn) {
            imageModal.browseBtn.classList.toggle('d-none', !this.fileBrowser);
        }

        if (imageModal.modal) {
            imageModal.modal.show();
            imageModal.form.elements.src.focus();
        }
    };

    HtmlEditor.prototype.setImageDialogUrl = function(url) {
        const imageModal = window.BrammoEditor.imageModal;
        if (!imageModal) {
            return;
        }
        imageModal.form.elements.src.value = url;
    };

    HtmlEditor.prototype.showImageFormView = function() {
        const imageModal = window.BrammoEditor.imageModal;
        if (!imageModal) {
            return;
        }

        this.imageBrowseEmbedded = false;
        imageModal.formView.classList.remove('d-none');
        imageModal.browseView.classList.add('d-none');
        this.updateImageModalLabels();
    };

    HtmlEditor.prototype.showImageBrowseView = function() {
        const imageModal = window.BrammoEditor.imageModal;
        if (!imageModal) {
            return;
        }

        this.imageBrowseEmbedded = true;
        imageModal.formView.classList.add('d-none');
        imageModal.browseView.classList.remove('d-none');
        imageModal.modalTitle.textContent = this.options.labels.imageBrowseTitle || 'Select Image';
    };

    HtmlEditor.prototype.openImagePickerForDialog = function() {
        if (!this.fileBrowser) {
            return;
        }

        const imageModal = window.BrammoEditor.imageModal;
        if (!imageModal) {
            return;
        }

        this.fileBrowser.setEmbeddedSelector(imageModal.browseSelector);

        const folder = this.options.folder || 'images';
        const target = this.imageTarget.id;
        const url = this.options.browseUrl + '?folder=' + encodeURIComponent(folder) +
            '&target=' + encodeURIComponent(target);

        this.showImageBrowseView();
        this.fileBrowser.loadContent(url, imageModal.browseSelector);
    };

    HtmlEditor.prototype.ensureLinkModal = function() {
        if (window.BrammoEditor.linkModal) {
            return window.BrammoEditor.linkModal;
        }

        const labels = this.options.labels || {};
        const modalEl = document.createElement('div');
        modalEl.id = 'editor-link-modal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML =
            '<div class="modal-dialog modal-lg">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h5 class="modal-title"></h5>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                    '</div>' +
                    '<div class="html-editor-link-form">' +
                        '<form class="modal-body">' +
                            '<div class="mb-3">' +
                                '<label class="form-label html-editor-link-url-label"></label>' +
                                '<div class="input-group">' +
                                    '<input type="text" class="form-control" name="url" required>' +
                                    '<button type="button" class="btn btn-outline-secondary html-editor-link-browse-btn">' +
                                        '<i class="bi bi-folder2-open"></i> ' +
                                        '<span class="html-editor-link-browse-label"></span>' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                            '<div class="mb-3">' +
                                '<label class="form-label html-editor-link-text-label"></label>' +
                                '<input type="text" class="form-control" name="text">' +
                            '</div>' +
                            '<div class="mb-3">' +
                                '<label class="form-label html-editor-link-title-label"></label>' +
                                '<input type="text" class="form-control" name="title">' +
                            '</div>' +
                            '<div class="mb-0">' +
                                '<label class="form-label html-editor-link-target-label"></label>' +
                                '<select class="form-select" name="target">' +
                                    '<option value=""></option>' +
                                    '<option value="_blank"></option>' +
                                    '<option value="_self"></option>' +
                                    '<option value="_parent"></option>' +
                                    '<option value="_top"></option>' +
                                '</select>' +
                            '</div>' +
                        '</form>' +
                        '<div class="modal-footer html-editor-link-footer">' +
                            '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"></button>' +
                            '<button type="button" class="btn btn-primary html-editor-link-insert"></button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="html-editor-link-browse-panel d-none">' +
                        '<div class="modal-body pb-0">' +
                            '<button type="button" class="btn btn-sm btn-outline-secondary html-editor-link-browse-back">' +
                                '<i class="bi bi-arrow-left"></i> ' +
                                '<span class="html-editor-link-browse-back-label"></span>' +
                            '</button>' +
                        '</div>' +
                        '<div class="html-editor-link-browse-body px-3 pb-3"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        modalEl.querySelector('.modal-title').textContent = labels.linkDialogTitle || 'Insert link';
        modalEl.querySelector('.html-editor-link-url-label').textContent = labels.linkUrl || 'URL';
        modalEl.querySelector('.html-editor-link-text-label').textContent = labels.linkText || 'Text';
        modalEl.querySelector('.html-editor-link-title-label').textContent = labels.linkTitle || 'Title';
        modalEl.querySelector('.html-editor-link-target-label').textContent = labels.linkTarget || 'Target';
        modalEl.querySelector('.html-editor-link-browse-label').textContent = labels.linkSelect || 'Select';
        modalEl.querySelector('.html-editor-link-browse-back-label').textContent = labels.linkBack || 'Back';
        modalEl.querySelector('.html-editor-link-footer .btn-secondary').textContent = labels.cancel || 'Cancel';
        modalEl.querySelector('.html-editor-link-insert').textContent = labels.linkInsert || 'Insert';

        const targetSelect = modalEl.querySelector('select[name="target"]');
        targetSelect.options[0].textContent = labels.linkTargetDefault || 'Same window';
        targetSelect.options[1].textContent = labels.linkTargetBlank || 'New window (_blank)';
        targetSelect.options[2].textContent = labels.linkTargetSelf || '_self';
        targetSelect.options[3].textContent = labels.linkTargetParent || '_parent';
        targetSelect.options[4].textContent = labels.linkTargetTop || '_top';

        document.body.appendChild(modalEl);

        const form = modalEl.querySelector('form');
        const formView = modalEl.querySelector('.html-editor-link-form');
        const browseView = modalEl.querySelector('.html-editor-link-browse-panel');
        const browseBtn = modalEl.querySelector('.html-editor-link-browse-btn');
        const browseBackBtn = modalEl.querySelector('.html-editor-link-browse-back');
        const insertBtn = modalEl.querySelector('.html-editor-link-insert');
        const closeBtn = modalEl.querySelector('.modal-header .btn-close');
        const modalTitle = modalEl.querySelector('.modal-title');
        const bsModal = typeof bootstrap !== 'undefined' ? new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false,
        }) : null;

        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeLinkEditor;
            if (editor) {
                editor.openLinkPickerForDialog();
            }
        });

        browseBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeLinkEditor;
            if (editor) {
                editor.showLinkFormView();
            }
        });

        closeBtn.addEventListener('click', function(e) {
            const editor = window.BrammoEditor.activeLinkEditor;
            if (editor && editor.linkBrowseEmbedded) {
                e.preventDefault();
                e.stopImmediatePropagation();
                editor.showLinkFormView();
            }
        });

        modalEl.addEventListener('hide.bs.modal', function(e) {
            const editor = window.BrammoEditor.activeLinkEditor;
            if (editor && editor.linkBrowseEmbedded) {
                e.preventDefault();
                editor.showLinkFormView();
            }
        });

        insertBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeLinkEditor;
            if (!editor) {
                return;
            }

            const url = form.elements.url.value.trim();
            if (!url) {
                form.elements.url.focus();
                return;
            }

            editor.insertLinkElement({
                url: url,
                text: form.elements.text.value,
                title: form.elements.title.value,
                target: form.elements.target.value,
            });

            if (bsModal) {
                bsModal.hide();
            }
        });

        modalEl.addEventListener('hidden.bs.modal', function() {
            const editor = window.BrammoEditor.activeLinkEditor;
            if (editor) {
                editor.linkDialogOpen = false;
                editor.linkBrowseEmbedded = false;
                editor.editingLink = null;
                editor.clearSavedSelection();
                editor.showLinkFormView();
            }
            window.BrammoEditor.activeLinkEditor = null;
            form.reset();
        });

        window.BrammoEditor.linkModal = {
            element: modalEl,
            form: form,
            formView: formView,
            browseView: browseView,
            browseBtn: browseBtn,
            modalTitle: modalTitle,
            insertBtn: insertBtn,
            modal: bsModal,
            browseSelector: '#editor-link-modal .html-editor-link-browse-body',
        };

        return window.BrammoEditor.linkModal;
    };

    HtmlEditor.prototype.updateLinkModalLabels = function() {
        const linkModal = window.BrammoEditor.linkModal;
        if (!linkModal) {
            return;
        }

        const labels = this.options.labels || {};
        const editing = !!this.editingLink;

        linkModal.modalTitle.textContent = editing
            ? (labels.linkEditTitle || 'Edit link')
            : (labels.linkDialogTitle || 'Insert link');
        linkModal.insertBtn.textContent = editing
            ? (labels.linkSave || 'Save')
            : (labels.linkInsert || 'Insert');
    };

    HtmlEditor.prototype.openLinkDialog = function(anchor) {
        const linkModal = this.ensureLinkModal();
        window.BrammoEditor.activeLinkEditor = this;
        this.linkDialogOpen = true;
        this.clearSavedSelection();
        this.editingLink = anchor && anchor.tagName === 'A' ? anchor : this.getLinkAtSelection();
        this.showLinkFormView();
        linkModal.form.reset();

        if (this.editingLink) {
            const props = this.getLinkProperties(this.editingLink);
            linkModal.form.elements.url.value = props.url;
            linkModal.form.elements.text.value = props.text;
            linkModal.form.elements.title.value = props.title;
            linkModal.form.elements.target.value = props.target;
        } else {
            linkModal.form.elements.text.value = this.getSelectedText();
            this.saveSelection();
        }

        this.updateLinkModalLabels();
        if (linkModal.browseBtn) {
            linkModal.browseBtn.classList.toggle('d-none', !this.fileBrowser);
        }

        if (linkModal.modal) {
            linkModal.modal.show();
            linkModal.form.elements.url.focus();
        }
    };

    HtmlEditor.prototype.setLinkDialogUrl = function(url) {
        const linkModal = window.BrammoEditor.linkModal;
        if (!linkModal) {
            return;
        }
        linkModal.form.elements.url.value = url;
    };

    HtmlEditor.prototype.showLinkFormView = function() {
        const linkModal = window.BrammoEditor.linkModal;
        if (!linkModal) {
            return;
        }

        this.linkBrowseEmbedded = false;
        linkModal.formView.classList.remove('d-none');
        linkModal.browseView.classList.add('d-none');
        this.updateLinkModalLabels();
    };

    HtmlEditor.prototype.showLinkBrowseView = function() {
        const linkModal = window.BrammoEditor.linkModal;
        if (!linkModal) {
            return;
        }

        this.linkBrowseEmbedded = true;
        linkModal.formView.classList.add('d-none');
        linkModal.browseView.classList.remove('d-none');
        linkModal.modalTitle.textContent = this.options.labels.linkBrowseTitle || 'Select file';
    };

    HtmlEditor.prototype.openLinkPickerForDialog = function() {
        if (!this.fileBrowser) {
            return;
        }

        const linkModal = window.BrammoEditor.linkModal;
        if (!linkModal) {
            return;
        }

        this.fileBrowser.setEmbeddedSelector(linkModal.browseSelector);

        const folder = this.options.linkFolder || 'files';
        const target = this.linkTarget.id;
        const url = this.options.filesBrowseUrl + '?folder=' + encodeURIComponent(folder) +
            '&target=' + encodeURIComponent(target);

        this.showLinkBrowseView();
        this.fileBrowser.loadContent(url, linkModal.browseSelector);
    };

    /**
     * @returns {HTMLTableElement|null}
     */
    HtmlEditor.prototype.getTableAtSelection = function() {
        const cell = this.getCellAtSelection();
        if (cell) {
            return cell.closest('table');
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        if (!node || !node.closest) {
            return null;
        }

        const table = node.closest('table');
        if (table && this.body.contains(table)) {
            return table;
        }

        return null;
    };

    /**
     * @returns {HTMLTableCellElement|null}
     */
    HtmlEditor.prototype.getCellAtSelection = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        if (!node || !node.closest) {
            return null;
        }

        const cell = node.closest('td, th');
        if (cell && this.body.contains(cell)) {
            return cell;
        }

        return null;
    };

    /**
     * Build a 2D matrix of cell references expanded over rowspan/colspan.
     *
     * @param {HTMLTableElement} table
     * @returns {Array<Array<HTMLTableCellElement|null>>}
     */
    HtmlEditor.prototype.buildTableMatrix = function(table) {
        const matrix = [];
        const rows = Array.prototype.slice.call(table.rows);

        rows.forEach(function(tr, rowIndex) {
            if (!matrix[rowIndex]) {
                matrix[rowIndex] = [];
            }

            let colIndex = 0;
            Array.prototype.slice.call(tr.cells).forEach(function(cell) {
                while (matrix[rowIndex][colIndex]) {
                    colIndex++;
                }

                const colspan = parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
                const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10) || 1;

                for (let r = 0; r < rowspan; r++) {
                    if (!matrix[rowIndex + r]) {
                        matrix[rowIndex + r] = [];
                    }
                    for (let c = 0; c < colspan; c++) {
                        matrix[rowIndex + r][colIndex + c] = cell;
                    }
                }

                colIndex += colspan;
            });
        });

        return matrix;
    };

    /**
     * @param {HTMLTableElement} table
     * @param {HTMLTableCellElement} cell
     * @returns {{row: number, col: number}|null}
     */
    HtmlEditor.prototype.getCellMatrixPosition = function(table, cell) {
        const matrix = this.buildTableMatrix(table);
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < (matrix[r] || []).length; c++) {
                if (matrix[r][c] === cell) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    };

    /**
     * @returns {Array<HTMLTableCellElement>}
     */
    HtmlEditor.prototype.getSelectedCells = function() {
        const selection = window.getSelection();
        const table = this.getTableAtSelection();
        if (!table || !selection || selection.rangeCount === 0) {
            return [];
        }

        const range = selection.getRangeAt(0);
        if (!this.body.contains(range.commonAncestorContainer)) {
            return [];
        }

        const cells = Array.prototype.slice.call(table.querySelectorAll('td, th'));
        const intersecting = cells.filter(function(cell) {
            try {
                return range.intersectsNode(cell);
            } catch (e) {
                return false;
            }
        });

        if (intersecting.length) {
            return intersecting;
        }

        const cell = this.getCellAtSelection();
        return cell ? [cell] : [];
    };

    /**
     * @param {number} rows
     * @param {number} cols
     * @param {Object} [opts]
     */
    HtmlEditor.prototype.insertTable = function(rows, cols, opts) {
        opts = opts || {};
        rows = Math.max(1, parseInt(rows, 10) || 1);
        cols = Math.max(1, parseInt(cols, 10) || 1);

        this.focusBody();
        this.restoreSavedSelection();

        const table = document.createElement('table');
        const tableClass = (opts.tableClass || this.options.tableClass || '').trim();
        if (tableClass) {
            table.className = tableClass;
        }

        if (opts.width) {
            table.style.width = this.normalizeCssSize(opts.width);
        }
        if (opts.align === 'left' || opts.align === 'right') {
            table.style.marginLeft = opts.align === 'left' ? '0' : 'auto';
            table.style.marginRight = opts.align === 'right' ? '0' : 'auto';
        } else if (opts.align === 'center') {
            table.style.marginLeft = 'auto';
            table.style.marginRight = 'auto';
        }
        if (opts.styles) {
            const styles = (opts.styles || '').trim().replace(/;+\s*$/, '');
            if (styles) {
                table.style.cssText = (table.style.cssText ? table.style.cssText + '; ' : '') + styles;
            }
        }

        const captionText = (opts.caption || '').trim();
        if (captionText) {
            const caption = document.createElement('caption');
            caption.textContent = captionText;
            table.appendChild(caption);
        }

        const headerRow = !!opts.headerRow;
        const headerCol = !!opts.headerColumn;
        const tbody = document.createElement('tbody');

        for (let r = 0; r < rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
                const isHeader = (headerRow && r === 0) || (headerCol && c === 0);
                const cell = document.createElement(isHeader ? 'th' : 'td');
                cell.innerHTML = '<br>';
                tr.appendChild(cell);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        let range = null;
        if (this.savedSelection) {
            range = this.savedSelection.cloneRange();
            this.clearSavedSelection();
        } else {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                range = selection.getRangeAt(0).cloneRange();
            }
        }

        const existingTable = this.getTableAtSelection();
        if (existingTable && existingTable.parentNode) {
            if (existingTable.nextSibling) {
                existingTable.parentNode.insertBefore(table, existingTable.nextSibling);
            } else {
                existingTable.parentNode.appendChild(table);
            }
        } else if (range && this.body.contains(range.commonAncestorContainer)) {
            if (!range.collapsed) {
                range.deleteContents();
            }
            range.insertNode(table);
        } else {
            this.body.appendChild(table);
        }

        const after = document.createElement('p');
        after.innerHTML = '<br>';
        if (table.nextSibling) {
            table.parentNode.insertBefore(after, table.nextSibling);
        } else {
            table.parentNode.appendChild(after);
        }

        const firstCell = table.querySelector('td, th');
        if (firstCell) {
            const sel = window.getSelection();
            const cellRange = document.createRange();
            cellRange.selectNodeContents(firstCell);
            cellRange.collapse(true);
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(cellRange);
            }
        }

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @param {boolean} before
     */
    HtmlEditor.prototype.insertTableRow = function(before) {
        const cell = this.getCellAtSelection();
        const table = cell ? cell.closest('table') : null;
        if (!cell || !table) {
            return;
        }

        const pos = this.getCellMatrixPosition(table, cell);
        if (!pos) {
            return;
        }

        const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10) || 1;
        const targetRow = before ? pos.row : pos.row + rowspan - 1;
        const insertAt = before ? targetRow : targetRow + 1;
        const refRow = table.rows[Math.min(targetRow, table.rows.length - 1)];
        if (!refRow) {
            return;
        }

        const newRow = document.createElement('tr');
        Array.prototype.slice.call(refRow.cells).forEach(function(refCell) {
            const colspan = parseInt(refCell.getAttribute('colspan') || '1', 10) || 1;
            const newCell = document.createElement(refCell.tagName === 'TH' ? 'th' : 'td');
            if (colspan > 1) {
                newCell.setAttribute('colspan', String(colspan));
            }
            newCell.innerHTML = '<br>';
            newRow.appendChild(newCell);
        });

        if (insertAt >= table.rows.length) {
            (table.tBodies[0] || table).appendChild(newRow);
        } else {
            const anchor = table.rows[insertAt];
            anchor.parentNode.insertBefore(newRow, anchor);
        }

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @param {boolean} before
     */
    HtmlEditor.prototype.insertTableColumn = function(before) {
        const cell = this.getCellAtSelection();
        const table = cell ? cell.closest('table') : null;
        if (!cell || !table) {
            return;
        }

        const matrix = this.buildTableMatrix(table);
        const pos = this.getCellMatrixPosition(table, cell);
        if (!pos) {
            return;
        }

        const colspan = parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
        const targetCol = before ? pos.col : pos.col + colspan - 1;
        const insertAt = before ? targetCol : targetCol + 1;
        const seen = [];

        Array.prototype.slice.call(table.rows).forEach(function(tr, rowIndex) {
            const rowMatrix = matrix[rowIndex] || [];
            let insertBeforeNode = null;
            let expandCell = null;

            for (let c = 0; c < rowMatrix.length; c++) {
                const current = rowMatrix[c];
                if (!current) {
                    continue;
                }
                if (c === insertAt) {
                    if (c > 0 && rowMatrix[c - 1] === current) {
                        expandCell = current;
                    } else {
                        insertBeforeNode = current;
                    }
                    break;
                }
            }

            if (expandCell) {
                if (seen.indexOf(expandCell) === -1) {
                    seen.push(expandCell);
                    expandCell.setAttribute('colspan', String((parseInt(expandCell.getAttribute('colspan') || '1', 10) || 1) + 1));
                }
                return;
            }

            const newCell = document.createElement('td');
            newCell.innerHTML = '<br>';
            if (insertBeforeNode && insertBeforeNode.parentNode === tr) {
                tr.insertBefore(newCell, insertBeforeNode);
            } else {
                tr.appendChild(newCell);
            }
        });

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.deleteTableRow = function() {
        const cell = this.getCellAtSelection();
        const table = cell ? cell.closest('table') : null;
        if (!cell || !table) {
            return;
        }

        const row = cell.parentNode;
        if (!row || row.tagName !== 'TR') {
            return;
        }

        if (table.rows.length <= 1) {
            this.deleteTable();
            return;
        }

        row.parentNode.removeChild(row);
        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.deleteTableColumn = function() {
        const cell = this.getCellAtSelection();
        const table = cell ? cell.closest('table') : null;
        if (!cell || !table) {
            return;
        }

        const matrix = this.buildTableMatrix(table);
        const pos = this.getCellMatrixPosition(table, cell);
        if (!pos) {
            return;
        }

        const colCount = matrix[0] ? matrix[0].length : 0;
        if (colCount <= 1) {
            this.deleteTable();
            return;
        }

        const targetCol = pos.col;
        const seen = [];

        matrix.forEach(function(row) {
            const target = row[targetCol];
            if (!target || seen.indexOf(target) !== -1) {
                return;
            }
            seen.push(target);

            const colspan = parseInt(target.getAttribute('colspan') || '1', 10) || 1;
            if (colspan > 1) {
                if (colspan === 2) {
                    target.removeAttribute('colspan');
                } else {
                    target.setAttribute('colspan', String(colspan - 1));
                }
            } else if (target.parentNode) {
                target.parentNode.removeChild(target);
            }
        });

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.deleteTable = function() {
        const table = this.getTableAtSelection();
        if (!table || !table.parentNode) {
            return;
        }

        const parent = table.parentNode;
        parent.removeChild(table);
        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.mergeCells = function() {
        const cells = this.getSelectedCells();
        const table = this.getTableAtSelection();
        if (!table || cells.length < 2) {
            return;
        }

        const matrix = this.buildTableMatrix(table);
        let minRow = Infinity;
        let maxRow = -1;
        let minCol = Infinity;
        let maxCol = -1;

        cells.forEach(function(cell) {
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < (matrix[r] || []).length; c++) {
                    if (matrix[r][c] === cell) {
                        minRow = Math.min(minRow, r);
                        maxRow = Math.max(maxRow, r);
                        minCol = Math.min(minCol, c);
                        maxCol = Math.max(maxCol, c);
                    }
                }
            }
        });

        if (!isFinite(minRow) || !isFinite(minCol)) {
            return;
        }

        const unique = [];
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cell = matrix[r][c];
                if (cell && unique.indexOf(cell) === -1) {
                    unique.push(cell);
                }
            }
        }

        if (unique.length < 2) {
            return;
        }

        const master = unique[0];
        const parts = [];
        unique.forEach(function(cell) {
            const html = cell.innerHTML.replace(/<br\s*\/?>/gi, '').trim();
            if (html) {
                parts.push(cell.innerHTML);
            }
        });
        master.innerHTML = parts.length ? parts.join('<br>') : '<br>';

        const rowspan = maxRow - minRow + 1;
        const colspan = maxCol - minCol + 1;
        if (rowspan > 1) {
            master.setAttribute('rowspan', String(rowspan));
        } else {
            master.removeAttribute('rowspan');
        }
        if (colspan > 1) {
            master.setAttribute('colspan', String(colspan));
        } else {
            master.removeAttribute('colspan');
        }

        unique.slice(1).forEach(function(cell) {
            if (cell.parentNode) {
                cell.parentNode.removeChild(cell);
            }
        });

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    HtmlEditor.prototype.splitCell = function() {
        const cell = this.getCellAtSelection();
        const table = cell ? cell.closest('table') : null;
        if (!cell || !table) {
            return;
        }

        const colspan = parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10) || 1;
        if (colspan === 1 && rowspan === 1) {
            return;
        }

        const pos = this.getCellMatrixPosition(table, cell);
        if (!pos) {
            return;
        }

        cell.removeAttribute('colspan');
        cell.removeAttribute('rowspan');

        for (let r = pos.row; r < pos.row + rowspan; r++) {
            const tr = table.rows[r];
            if (!tr) {
                continue;
            }
            for (let c = pos.col; c < pos.col + colspan; c++) {
                if (r === pos.row && c === pos.col) {
                    continue;
                }
                const newCell = document.createElement(cell.tagName === 'TH' ? 'th' : 'td');
                newCell.innerHTML = '<br>';

                const currentMatrix = this.buildTableMatrix(table);
                let inserted = false;
                for (let i = 0; i < tr.cells.length; i++) {
                    const existing = tr.cells[i];
                    const existingPos = this.getCellMatrixPosition(table, existing);
                    if (existingPos && existingPos.col > c) {
                        tr.insertBefore(newCell, existing);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    // Find a cell at or after this column from the current matrix
                    let anchor = null;
                    for (let cc = c + 1; cc < (currentMatrix[r] || []).length; cc++) {
                        const candidate = currentMatrix[r][cc];
                        if (candidate && candidate !== cell && candidate.parentNode === tr) {
                            anchor = candidate;
                            break;
                        }
                    }
                    if (anchor) {
                        tr.insertBefore(newCell, anchor);
                    } else {
                        tr.appendChild(newCell);
                    }
                }
            }
        }

        this.sync();
        this.commitHistory();
        this.refreshToolbarState();
    };

    /**
     * @param {number} direction 1 = next, -1 = previous
     */
    HtmlEditor.prototype.navigateTableCell = function(direction) {
        const cell = this.getCellAtSelection();
        const table = cell ? cell.closest('table') : null;
        if (!cell || !table) {
            return;
        }

        const cells = Array.prototype.slice.call(table.querySelectorAll('td, th'));
        const index = cells.indexOf(cell);
        if (index === -1) {
            return;
        }

        let next = cells[index + direction];
        if (!next && direction > 0) {
            this.insertTableRow(false);
            const refreshed = Array.prototype.slice.call(table.querySelectorAll('td, th'));
            next = refreshed[index + 1] || refreshed[refreshed.length - 1];
        }

        if (!next) {
            return;
        }

        this.focusBody();
        const range = document.createRange();
        range.selectNodeContents(next);
        range.collapse(true);
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        this.refreshToolbarState();
    };

    /**
     * @param {HTMLTableElement} table
     * @returns {Object}
     */
    HtmlEditor.prototype.getTableProperties = function(table) {
        const caption = table.querySelector('caption');
        let align = '';
        const ml = table.style.marginLeft;
        const mr = table.style.marginRight;
        if (ml === 'auto' && mr === 'auto') {
            align = 'center';
        } else if (ml === 'auto' && (mr === '0' || mr === '0px')) {
            align = 'right';
        } else if ((ml === '0' || ml === '0px') && mr === 'auto') {
            align = 'left';
        }

        const styleParts = [];
        for (let i = 0; i < table.style.length; i++) {
            const name = table.style[i];
            if (name !== 'width' && name !== 'margin-left' && name !== 'margin-right') {
                styleParts.push(name + ': ' + table.style.getPropertyValue(name));
            }
        }

        const firstRow = table.rows[0];
        let headerRow = false;
        let headerColumn = false;
        if (firstRow) {
            headerRow = Array.prototype.every.call(firstRow.cells, function(c) {
                return c.tagName === 'TH';
            });
            headerColumn = Array.prototype.every.call(table.rows, function(tr) {
                return tr.cells[0] && tr.cells[0].tagName === 'TH';
            });
        }

        return {
            rows: table.rows.length,
            cols: firstRow ? firstRow.cells.length : 0,
            headerRow: headerRow,
            headerColumn: headerColumn,
            caption: caption ? caption.textContent : '',
            width: table.style.width || '',
            align: align,
            tableClass: table.className || '',
            styles: styleParts.join('; '),
        };
    };

    /**
     * @param {HTMLTableElement} table
     * @param {Object} props
     */
    HtmlEditor.prototype.applyTableProperties = function(table, props) {
        const captionText = (props.caption || '').trim();
        let caption = table.querySelector('caption');
        if (captionText) {
            if (!caption) {
                caption = document.createElement('caption');
                table.insertBefore(caption, table.firstChild);
            }
            caption.textContent = captionText;
        } else if (caption) {
            caption.parentNode.removeChild(caption);
        }

        const tableClass = (props.tableClass || '').trim();
        if (tableClass) {
            table.className = tableClass;
        } else {
            table.removeAttribute('class');
        }

        table.style.removeProperty('width');
        table.style.removeProperty('margin-left');
        table.style.removeProperty('margin-right');

        const width = this.normalizeCssSize(props.width || '');
        if (width) {
            table.style.width = width;
        }

        const align = (props.align || '').trim();
        if (align === 'left') {
            table.style.marginLeft = '0';
            table.style.marginRight = 'auto';
        } else if (align === 'right') {
            table.style.marginLeft = 'auto';
            table.style.marginRight = '0';
        } else if (align === 'center') {
            table.style.marginLeft = 'auto';
            table.style.marginRight = 'auto';
        }

        const styles = (props.styles || '').trim().replace(/;+\s*$/, '');
        if (styles) {
            const current = table.style.cssText ? table.style.cssText + '; ' : '';
            table.style.cssText = current + styles;
        }

        if (!table.style.length) {
            table.removeAttribute('style');
        }

        if (typeof props.headerRow === 'boolean' || typeof props.headerColumn === 'boolean') {
            const headerRow = !!props.headerRow;
            const headerColumn = !!props.headerColumn;
            Array.prototype.slice.call(table.rows).forEach(function(tr, rowIndex) {
                Array.prototype.slice.call(tr.cells).forEach(function(cell, colIndex) {
                    const wantTh = (headerRow && rowIndex === 0) || (headerColumn && colIndex === 0);
                    const wantTag = wantTh ? 'TH' : 'TD';
                    if (cell.tagName === wantTag) {
                        return;
                    }
                    const replacement = document.createElement(wantTag.toLowerCase());
                    Array.prototype.slice.call(cell.attributes).forEach(function(attr) {
                        replacement.setAttribute(attr.name, attr.value);
                    });
                    while (cell.firstChild) {
                        replacement.appendChild(cell.firstChild);
                    }
                    cell.parentNode.replaceChild(replacement, cell);
                });
            });
        }
    };

    /**
     * @param {HTMLTableCellElement} cell
     * @returns {Object}
     */
    HtmlEditor.prototype.getCellProperties = function(cell) {
        return {
            width: cell.style.width || '',
            height: cell.style.height || '',
            align: cell.style.textAlign || '',
            valign: cell.style.verticalAlign || '',
            background: cell.style.backgroundColor || '',
            cellType: cell.tagName === 'TH' ? 'th' : 'td',
        };
    };

    /**
     * @param {HTMLTableCellElement} cell
     * @param {Object} props
     */
    HtmlEditor.prototype.applyCellProperties = function(cell, props) {
        const width = this.normalizeCssSize(props.width || '');
        const height = this.normalizeCssSize(props.height || '');
        const align = (props.align || '').trim();
        const valign = (props.valign || '').trim();
        const background = (props.background || '').trim();

        if (width) {
            cell.style.width = width;
        } else {
            cell.style.removeProperty('width');
        }
        if (height) {
            cell.style.height = height;
        } else {
            cell.style.removeProperty('height');
        }
        if (align) {
            cell.style.textAlign = align;
        } else {
            cell.style.removeProperty('text-align');
        }
        if (valign) {
            cell.style.verticalAlign = valign;
        } else {
            cell.style.removeProperty('vertical-align');
        }
        if (background) {
            cell.style.backgroundColor = background;
        } else {
            cell.style.removeProperty('background-color');
        }

        if (!cell.style.length) {
            cell.removeAttribute('style');
        }

        const wantType = (props.cellType || 'td').toLowerCase() === 'th' ? 'TH' : 'TD';
        if (cell.tagName !== wantType) {
            const replacement = document.createElement(wantType.toLowerCase());
            Array.prototype.slice.call(cell.attributes).forEach(function(attr) {
                replacement.setAttribute(attr.name, attr.value);
            });
            while (cell.firstChild) {
                replacement.appendChild(cell.firstChild);
            }
            cell.parentNode.replaceChild(replacement, cell);
            return replacement;
        }

        return cell;
    };

    HtmlEditor.prototype.ensureTableModal = function() {
        if (window.BrammoEditor.tableModal) {
            return window.BrammoEditor.tableModal;
        }

        const labels = this.options.labels || {};
        const modalEl = document.createElement('div');
        modalEl.id = 'editor-table-modal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML =
            '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h5 class="modal-title"></h5>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                    '</div>' +
                    '<form class="modal-body">' +
                        '<div class="row g-2 mb-3 html-editor-table-size-fields">' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-table-rows-label"></label>' +
                                '<input type="number" class="form-control" name="rows" min="1" max="50" value="2">' +
                            '</div>' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-table-cols-label"></label>' +
                                '<input type="number" class="form-control" name="cols" min="1" max="50" value="2">' +
                            '</div>' +
                        '</div>' +
                        '<div class="mb-3">' +
                            '<div class="form-check">' +
                                '<input type="checkbox" class="form-check-input" name="headerRow" id="editor-table-header-row">' +
                                '<label class="form-check-label html-editor-table-header-row-label" for="editor-table-header-row"></label>' +
                            '</div>' +
                            '<div class="form-check">' +
                                '<input type="checkbox" class="form-check-input" name="headerColumn" id="editor-table-header-col">' +
                                '<label class="form-check-label html-editor-table-header-col-label" for="editor-table-header-col"></label>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mb-3">' +
                            '<label class="form-label html-editor-table-caption-label"></label>' +
                            '<input type="text" class="form-control" name="caption">' +
                        '</div>' +
                        '<div class="row g-2 mb-3">' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-table-width-label"></label>' +
                                '<input type="text" class="form-control" name="width" placeholder="100%">' +
                            '</div>' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-table-align-label"></label>' +
                                '<select class="form-select" name="align">' +
                                    '<option value=""></option>' +
                                    '<option value="left"></option>' +
                                    '<option value="center"></option>' +
                                    '<option value="right"></option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mb-3">' +
                            '<label class="form-label html-editor-table-class-label"></label>' +
                            '<input type="text" class="form-control" name="tableClass">' +
                        '</div>' +
                        '<div class="mb-0">' +
                            '<label class="form-label html-editor-table-styles-label"></label>' +
                            '<input type="text" class="form-control" name="styles" placeholder="border-collapse: collapse">' +
                        '</div>' +
                    '</form>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"></button>' +
                        '<button type="button" class="btn btn-primary html-editor-table-insert"></button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        modalEl.querySelector('.modal-title').textContent = labels.tableDialogTitle || 'Insert table';
        modalEl.querySelector('.html-editor-table-rows-label').textContent = labels.tableRows || 'Rows';
        modalEl.querySelector('.html-editor-table-cols-label').textContent = labels.tableColumns || 'Columns';
        modalEl.querySelector('.html-editor-table-header-row-label').textContent = labels.tableHeaderRow || 'Header row';
        modalEl.querySelector('.html-editor-table-header-col-label').textContent = labels.tableHeaderColumn || 'Header column';
        modalEl.querySelector('.html-editor-table-caption-label').textContent = labels.tableCaption || 'Caption';
        modalEl.querySelector('.html-editor-table-width-label').textContent = labels.tableWidth || 'Width';
        modalEl.querySelector('.html-editor-table-align-label').textContent = labels.tableAlign || 'Alignment';
        modalEl.querySelector('.html-editor-table-class-label').textContent = labels.tableClass || 'CSS class';
        modalEl.querySelector('.html-editor-table-styles-label').textContent = labels.tableStyles || 'Styles';
        modalEl.querySelector('.modal-footer .btn-secondary').textContent = labels.cancel || 'Cancel';
        modalEl.querySelector('.html-editor-table-insert').textContent = labels.tableInsert || 'Insert';

        const alignSelect = modalEl.querySelector('select[name="align"]');
        alignSelect.options[0].textContent = labels.tableAlignDefault || 'Default';
        alignSelect.options[1].textContent = labels.alignLeft || 'Left';
        alignSelect.options[2].textContent = labels.alignCenter || 'Center';
        alignSelect.options[3].textContent = labels.alignRight || 'Right';

        document.body.appendChild(modalEl);

        const form = modalEl.querySelector('form');
        const sizeFields = modalEl.querySelector('.html-editor-table-size-fields');
        const insertBtn = modalEl.querySelector('.html-editor-table-insert');
        const modalTitle = modalEl.querySelector('.modal-title');
        const bsModal = typeof bootstrap !== 'undefined' ? new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false,
        }) : null;

        insertBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeTableEditor;
            if (!editor) {
                return;
            }

            const props = {
                rows: form.elements.rows.value,
                cols: form.elements.cols.value,
                headerRow: form.elements.headerRow.checked,
                headerColumn: form.elements.headerColumn.checked,
                caption: form.elements.caption.value,
                width: form.elements.width.value,
                align: form.elements.align.value,
                tableClass: form.elements.tableClass.value,
                styles: form.elements.styles.value,
            };

            if (editor.editingTable) {
                editor.applyTableProperties(editor.editingTable, props);
                editor.editingTable = null;
                editor.sync();
                editor.commitHistory();
                editor.refreshToolbarState();
            } else {
                editor.insertTable(props.rows, props.cols, props);
            }

            if (bsModal) {
                bsModal.hide();
            }
        });

        modalEl.addEventListener('hidden.bs.modal', function() {
            const editor = window.BrammoEditor.activeTableEditor;
            if (editor) {
                editor.editingTable = null;
                editor.clearSavedSelection();
            }
            window.BrammoEditor.activeTableEditor = null;
            form.reset();
        });

        window.BrammoEditor.tableModal = {
            element: modalEl,
            form: form,
            sizeFields: sizeFields,
            modalTitle: modalTitle,
            insertBtn: insertBtn,
            modal: bsModal,
        };

        return window.BrammoEditor.tableModal;
    };

    HtmlEditor.prototype.updateTableModalLabels = function() {
        const tableModal = window.BrammoEditor.tableModal;
        if (!tableModal) {
            return;
        }

        const labels = this.options.labels || {};
        const editing = !!this.editingTable;

        tableModal.modalTitle.textContent = editing
            ? (labels.tableEditTitle || 'Edit table')
            : (labels.tableDialogTitle || 'Insert table');
        tableModal.insertBtn.textContent = editing
            ? (labels.tableSave || 'Save')
            : (labels.tableInsert || 'Insert');
        tableModal.sizeFields.classList.toggle('d-none', editing);
    };

    HtmlEditor.prototype.openTableDialog = function(table) {
        const tableModal = this.ensureTableModal();
        window.BrammoEditor.activeTableEditor = this;
        this.saveSelection();
        this.editingTable = table && table.tagName === 'TABLE' ? table : this.getTableAtSelection();
        tableModal.form.reset();

        if (this.editingTable) {
            const props = this.getTableProperties(this.editingTable);
            tableModal.form.elements.rows.value = props.rows;
            tableModal.form.elements.cols.value = props.cols;
            tableModal.form.elements.headerRow.checked = props.headerRow;
            tableModal.form.elements.headerColumn.checked = props.headerColumn;
            tableModal.form.elements.caption.value = props.caption;
            tableModal.form.elements.width.value = props.width;
            tableModal.form.elements.align.value = props.align;
            tableModal.form.elements.tableClass.value = props.tableClass;
            tableModal.form.elements.styles.value = props.styles;
        } else {
            tableModal.form.elements.rows.value = 2;
            tableModal.form.elements.cols.value = 2;
            tableModal.form.elements.tableClass.value = this.options.tableClass || '';
        }

        this.updateTableModalLabels();

        if (tableModal.modal) {
            tableModal.modal.show();
        }
    };

    HtmlEditor.prototype.ensureCellModal = function() {
        if (window.BrammoEditor.cellModal) {
            return window.BrammoEditor.cellModal;
        }

        const labels = this.options.labels || {};
        const modalEl = document.createElement('div');
        modalEl.id = 'editor-cell-modal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.innerHTML =
            '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h5 class="modal-title"></h5>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                    '</div>' +
                    '<form class="modal-body">' +
                        '<div class="row g-2 mb-3">' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-cell-width-label"></label>' +
                                '<input type="text" class="form-control" name="width" placeholder="100">' +
                            '</div>' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-cell-height-label"></label>' +
                                '<input type="text" class="form-control" name="height" placeholder="40">' +
                            '</div>' +
                        '</div>' +
                        '<div class="row g-2 mb-3">' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-cell-align-label"></label>' +
                                '<select class="form-select" name="align">' +
                                    '<option value=""></option>' +
                                    '<option value="left"></option>' +
                                    '<option value="center"></option>' +
                                    '<option value="right"></option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="col-sm-6">' +
                                '<label class="form-label html-editor-cell-valign-label"></label>' +
                                '<select class="form-select" name="valign">' +
                                    '<option value=""></option>' +
                                    '<option value="top"></option>' +
                                    '<option value="middle"></option>' +
                                    '<option value="bottom"></option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mb-3">' +
                            '<label class="form-label html-editor-cell-bg-label"></label>' +
                            '<input type="text" class="form-control" name="background" placeholder="#f8f9fa">' +
                        '</div>' +
                        '<div class="mb-0">' +
                            '<label class="form-label html-editor-cell-type-label"></label>' +
                            '<select class="form-select" name="cellType">' +
                                '<option value="td"></option>' +
                                '<option value="th"></option>' +
                            '</select>' +
                        '</div>' +
                    '</form>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"></button>' +
                        '<button type="button" class="btn btn-primary html-editor-cell-save"></button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        modalEl.querySelector('.modal-title').textContent = labels.cellProperties || 'Cell properties';
        modalEl.querySelector('.html-editor-cell-width-label').textContent = labels.cellWidth || 'Width';
        modalEl.querySelector('.html-editor-cell-height-label').textContent = labels.cellHeight || 'Height';
        modalEl.querySelector('.html-editor-cell-align-label').textContent = labels.cellAlign || 'Text align';
        modalEl.querySelector('.html-editor-cell-valign-label').textContent = labels.cellValign || 'Vertical align';
        modalEl.querySelector('.html-editor-cell-bg-label').textContent = labels.cellBackground || 'Background';
        modalEl.querySelector('.html-editor-cell-type-label').textContent = labels.cellType || 'Cell type';
        modalEl.querySelector('.modal-footer .btn-secondary').textContent = labels.cancel || 'Cancel';
        modalEl.querySelector('.html-editor-cell-save').textContent = labels.cellSave || 'Save';

        const alignSelect = modalEl.querySelector('select[name="align"]');
        alignSelect.options[0].textContent = labels.tableAlignDefault || 'Default';
        alignSelect.options[1].textContent = labels.alignLeft || 'Left';
        alignSelect.options[2].textContent = labels.alignCenter || 'Center';
        alignSelect.options[3].textContent = labels.alignRight || 'Right';

        const valignSelect = modalEl.querySelector('select[name="valign"]');
        valignSelect.options[0].textContent = labels.tableAlignDefault || 'Default';
        valignSelect.options[1].textContent = labels.cellValignTop || 'Top';
        valignSelect.options[2].textContent = labels.cellValignMiddle || 'Middle';
        valignSelect.options[3].textContent = labels.cellValignBottom || 'Bottom';

        const typeSelect = modalEl.querySelector('select[name="cellType"]');
        typeSelect.options[0].textContent = labels.cellTypeData || 'Data cell';
        typeSelect.options[1].textContent = labels.cellTypeHeader || 'Header cell';

        document.body.appendChild(modalEl);

        const form = modalEl.querySelector('form');
        const saveBtn = modalEl.querySelector('.html-editor-cell-save');
        const bsModal = typeof bootstrap !== 'undefined' ? new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false,
        }) : null;

        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const editor = window.BrammoEditor.activeCellEditor;
            if (!editor || !editor.editingCells || !editor.editingCells.length) {
                return;
            }

            const props = {
                width: form.elements.width.value,
                height: form.elements.height.value,
                align: form.elements.align.value,
                valign: form.elements.valign.value,
                background: form.elements.background.value,
                cellType: form.elements.cellType.value,
            };

            editor.editingCells.forEach(function(cell) {
                if (cell.parentNode) {
                    editor.applyCellProperties(cell, props);
                }
            });
            editor.editingCells = null;
            editor.sync();
            editor.commitHistory();
            editor.refreshToolbarState();

            if (bsModal) {
                bsModal.hide();
            }
        });

        modalEl.addEventListener('hidden.bs.modal', function() {
            const editor = window.BrammoEditor.activeCellEditor;
            if (editor) {
                editor.editingCells = null;
            }
            window.BrammoEditor.activeCellEditor = null;
            form.reset();
        });

        window.BrammoEditor.cellModal = {
            element: modalEl,
            form: form,
            modal: bsModal,
        };

        return window.BrammoEditor.cellModal;
    };

    HtmlEditor.prototype.openCellDialog = function() {
        const cells = this.getSelectedCells();
        if (!cells.length) {
            return;
        }

        const cellModal = this.ensureCellModal();
        window.BrammoEditor.activeCellEditor = this;
        this.editingCells = cells;
        cellModal.form.reset();

        const props = this.getCellProperties(cells[0]);
        cellModal.form.elements.width.value = props.width;
        cellModal.form.elements.height.value = props.height;
        cellModal.form.elements.align.value = props.align;
        cellModal.form.elements.valign.value = props.valign;
        cellModal.form.elements.background.value = props.background;
        cellModal.form.elements.cellType.value = props.cellType;

        if (cellModal.modal) {
            cellModal.modal.show();
        }
    };

    HtmlEditor.prototype.refreshTableMenuState = function() {
        if (!this.tableMenu) {
            return;
        }

        const inTable = !!this.getTableAtSelection();
        const selectedCells = this.getSelectedCells();
        const cell = this.getCellAtSelection();
        const canMerge = selectedCells.length > 1;
        let canSplit = false;
        if (cell) {
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
            const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10) || 1;
            canSplit = colspan > 1 || rowspan > 1;
        }

        if (this.tableGridWrap) {
            this.tableGridWrap.classList.toggle('d-none', inTable);
        }

        this.tableMenu.querySelectorAll('[data-table-action]').forEach(function(btn) {
            btn.classList.toggle('d-none', !inTable);

            const action = btn.dataset.tableAction;
            let enabled = true;
            if (action === 'mergeCells') {
                enabled = canMerge;
            } else if (action === 'splitCell') {
                enabled = canSplit;
            }
            btn.disabled = !enabled;
            btn.classList.toggle('disabled', !enabled);
        });
    };

    HtmlEditor.prototype.toggleSource = function() {
        if (this.sourceMode) {
            this.body.innerHTML = this.textarea.value;
            this.sourceWrap.hidden = true;
            this.textarea.setAttribute('aria-hidden', 'true');
            this.body.hidden = false;
            this.body.contentEditable = 'true';
            this.sourceMode = false;
            this.statusPath = '';
            this.commitHistory();
            this.refreshToolbarState();
        } else {
            this.commitHistory();
            this.sync();
            this.sourceWrap.hidden = false;
            this.textarea.removeAttribute('aria-hidden');
            this.body.hidden = true;
            this.body.contentEditable = 'false';
            this.sourceMode = true;
            this.textarea.setSelectionRange(0, 0);
            this.textarea.scrollTop = 0;
            this.textarea.scrollLeft = 0;
            this.renderSource();
            this.textarea.focus();
        }

        this.updateToolbarState();
    };

    HtmlEditor.prototype.formatSource = function() {
        if (!this.sourceMode) {
            return;
        }

        this.textarea.value = formatHtml(this.textarea.value);
        this.textarea.setSelectionRange(0, 0);
        this.textarea.scrollTop = 0;
        this.renderSource();
        this.textarea.focus();
    };

    HtmlEditor.prototype.onSourceInput = function() {
        if (!this.sourceMode) {
            return;
        }
        this.scheduleSourceRender();
    };

    HtmlEditor.prototype.onSourceScroll = function() {
        this.syncSourceScroll();
    };

    HtmlEditor.prototype.scheduleSourceRender = function() {
        if (this.sourceRenderFrame) {
            cancelAnimationFrame(this.sourceRenderFrame);
        }
        this.sourceRenderFrame = requestAnimationFrame(function() {
            this.sourceRenderFrame = null;
            this.renderSource();
        }.bind(this));
    };

    HtmlEditor.prototype.renderSource = function() {
        if (!this.sourceWrap || !this.sourceHighlightCode || !this.sourceGutter) {
            return;
        }

        const value = this.textarea.value;
        const plain = value.length > SOURCE_HIGHLIGHT_LIMIT;
        this.sourceWrap.classList.toggle('is-plain', plain);

        if (plain) {
            this.sourceHighlightCode.textContent = '';
            this.sourceGutter.textContent = '';
            return;
        }

        // Match the textarea's wrapping width, which shrinks when its scrollbar shows.
        this.sourceHighlight.style.width = this.textarea.clientWidth + 'px';

        const lines = highlightLines(value);
        this.sourceHighlightCode.innerHTML = lines.map(function(line) {
            return '<div class="html-editor-line">' + (line || '&#8203;') + '</div>';
        }).join('');

        let gutterHtml = '';
        for (let n = 1; n <= lines.length; n++) {
            gutterHtml += '<div class="html-editor-gutter-line">' + n + '</div>';
        }
        this.sourceGutter.innerHTML = gutterHtml;

        this.alignSourceGutter();
        this.syncSourceScroll();
    };

    /**
     * Give each gutter number the height of its (possibly wrapped) source line.
     */
    HtmlEditor.prototype.alignSourceGutter = function() {
        const lineEls = this.sourceHighlightCode.children;
        const gutterEls = this.sourceGutter.children;

        for (let i = 0; i < gutterEls.length; i++) {
            const line = lineEls[i];
            if (!line) {
                break;
            }
            gutterEls[i].style.height = line.getBoundingClientRect().height + 'px';
        }
    };

    HtmlEditor.prototype.syncSourceScroll = function() {
        if (!this.sourceHighlight || !this.sourceGutter) {
            return;
        }
        this.sourceHighlight.scrollTop = this.textarea.scrollTop;
        this.sourceGutter.scrollTop = this.textarea.scrollTop;
    };

    /**
     * Insert text into the source textarea, preferring execCommand for native undo.
     *
     * @param {string} text
     */
    HtmlEditor.prototype.insertSourceText = function(text) {
        this.textarea.focus();
        let inserted = false;
        try {
            inserted = document.execCommand('insertText', false, text);
        } catch (e) {
            inserted = false;
        }

        if (!inserted) {
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            this.textarea.setRangeText(text, start, end, 'end');
        }

        this.scheduleSourceRender();
    };

    /**
     * Replace a range in the source textarea.
     *
     * @param {number} start
     * @param {number} end
     * @param {string} text
     * @param {number} [cursor]
     */
    HtmlEditor.prototype.replaceSourceRange = function(start, end, text, cursor) {
        this.textarea.focus();
        this.textarea.setSelectionRange(start, end);

        let inserted = false;
        try {
            inserted = document.execCommand('insertText', false, text);
        } catch (e) {
            inserted = false;
        }

        if (!inserted) {
            this.textarea.setRangeText(text, start, end, 'end');
        }

        if (typeof cursor === 'number') {
            this.textarea.setSelectionRange(cursor, cursor);
        }

        this.scheduleSourceRender();
    };

    /**
     * @param {KeyboardEvent} e
     */
    HtmlEditor.prototype.onSourceKeyDown = function(e) {
        if (!this.sourceMode || this.destroyed) {
            return;
        }

        if (e.key === 'Tab' && !(e.ctrlKey || e.metaKey || e.altKey)) {
            e.preventDefault();
            this.handleSourceTab(e.shiftKey);
            return;
        }

        if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)) {
            e.preventDefault();
            this.handleSourceEnter();
        }
    };

    /**
     * @param {boolean} outdent
     */
    HtmlEditor.prototype.handleSourceTab = function(outdent) {
        const value = this.textarea.value;
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;

        if (start !== end) {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const selected = value.slice(lineStart, end);
            const lines = selected.split('\n');
            let next;

            if (outdent) {
                next = lines.map(function(line) {
                    if (line.indexOf(SOURCE_INDENT) === 0) {
                        return line.slice(SOURCE_INDENT.length);
                    }
                    if (line.charAt(0) === '\t') {
                        return line.slice(1);
                    }
                    return line.replace(/^[ \t]{1,2}/, '');
                }).join('\n');
            } else {
                next = lines.map(function(line) {
                    return SOURCE_INDENT + line;
                }).join('\n');
            }

            const delta = next.length - selected.length;
            this.replaceSourceRange(lineStart, end, next, end + delta);
            this.textarea.setSelectionRange(lineStart, lineStart + next.length);
            return;
        }

        if (outdent) {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const line = value.slice(lineStart, start);
            const leading = line.match(/^[ \t]+/);
            if (!leading) {
                return;
            }
            const remove = leading[0].indexOf(SOURCE_INDENT) === 0
                ? SOURCE_INDENT.length
                : (leading[0].charAt(0) === '\t' ? 1 : Math.min(2, leading[0].length));
            this.replaceSourceRange(lineStart, lineStart + remove, '', start - remove);
            return;
        }

        this.insertSourceText(SOURCE_INDENT);
    };

    HtmlEditor.prototype.handleSourceEnter = function() {
        const value = this.textarea.value;
        const start = this.textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineBefore = value.slice(lineStart, start);
        const leading = (lineBefore.match(/^[ \t]*/) || [''])[0];
        let indent = leading;

        const openMatch = lineBefore.match(/<([a-zA-Z][\w:-]*)\b[^>]*>\s*$/);
        if (openMatch) {
            const tag = openMatch[1].toLowerCase();
            const isSelfClosing = /\/\s*>\s*$/.test(openMatch[0]) || VOID_TAGS[tag];
            if (!isSelfClosing && !INLINE_TAGS[tag] && !PRESERVE_TAGS[tag]) {
                indent = leading + SOURCE_INDENT;
            }
        }

        this.insertSourceText('\n' + indent);
    };

    HtmlEditor.prototype.onSelectionChange = function() {
        if (this.destroyed || this.sourceMode) {
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const node = selection.anchorNode;
        if (!node || !this.body.contains(node)) {
            return;
        }

        this.trackSelectedImage();
        this.refreshToolbarState();
    };

    /**
     * Ancestor elements from the editor body down to the node at the caret.
     *
     * @returns {Array<Element>}
     */
    HtmlEditor.prototype.getElementPath = function() {
        let node = this.getImageAtSelection();
        if (!node) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                return [];
            }
            node = selection.anchorNode;
            if (node && node.nodeType === Node.TEXT_NODE) {
                node = node.parentNode;
            }
        }

        if (!node || !this.body.contains(node)) {
            return [];
        }

        const path = [];
        while (node && node !== this.body) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                path.unshift(node);
            }
            node = node.parentNode;
        }

        return path;
    };

    /**
     * Select an element from the status bar path.
     *
     * @param {Element} el
     */
    HtmlEditor.prototype.selectElementNode = function(el) {
        if (!el || !this.body.contains(el)) {
            return;
        }

        this.focusBody();
        const range = document.createRange();
        const tag = el.nodeName.toUpperCase();
        if (tag === 'IMG' || tag === 'HR') {
            range.selectNode(el);
        } else {
            range.selectNodeContents(el);
        }

        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.refreshToolbarState();
    };

    HtmlEditor.prototype.updateStatusBar = function() {
        if (!this.statusBar) {
            return;
        }

        if (this.sourceMode) {
            if (this.statusPath !== '') {
                this.statusPath = '';
                this.statusBar.innerHTML = '';
            }
            return;
        }

        const path = this.getElementPath();
        const pathKey = path.map(function(el) {
            return el.nodeName.toLowerCase();
        }).join('>');

        if (pathKey === this.statusPath) {
            return;
        }

        this.statusPath = pathKey;
        this.statusBar.innerHTML = '';

        const self = this;
        path.forEach(function(el, index) {
            if (index > 0) {
                const sep = document.createElement('span');
                sep.className = 'html-editor-path-sep';
                sep.textContent = '>';
                self.statusBar.appendChild(sep);
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-link btn-sm html-editor-path-item';
            button.textContent = el.nodeName.toLowerCase();
            button.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });
            button.addEventListener('click', function(e) {
                e.preventDefault();
                self.selectElementNode(el);
            });
            self.statusBar.appendChild(button);
        });
    };

    /**
     * @returns {string}
     */
    HtmlEditor.prototype.getBlockTag = function() {
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
            let node = selection.anchorNode;
            if (node && node.nodeType === Node.TEXT_NODE) {
                node = node.parentNode;
            }

            while (node && node !== this.body) {
                if (FORMAT_BLOCK_TAGS.includes(node.nodeName)) {
                    return node.nodeName.toLowerCase();
                }
                node = node.parentNode;
            }
        }

        let block = document.queryCommandValue('formatBlock') || 'p';
        block = block.replace(/[<>]/g, '').toLowerCase();

        return FORMAT_BLOCK_TAGS.map(function(tag) {
            return tag.toLowerCase();
        }).includes(block) ? block : 'p';
    };

    /**
     * @returns {HTMLElement|null}
     */
    HtmlEditor.prototype.getCodeAtSelection = function() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        while (node && node !== this.body) {
            if (node.nodeName === 'CODE') {
                return node;
            }
            node = node.parentNode;
        }

        return null;
    };

    HtmlEditor.prototype.refreshToolbarState = function() {
        if (this.sourceMode) {
            return;
        }

        if (this.blockSelect) {
            this.blockSelect.value = this.getBlockTag();
        }

        const currentAlign = this.getCurrentTextAlign();
        this.toolbar.querySelectorAll('button[data-action]').forEach(function(btn) {
            const align = ALIGN_ACTIONS[btn.dataset.action];
            if (!align) {
                return;
            }
            const active = currentAlign === align;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        this.toolbar.querySelectorAll('button[data-cmd]').forEach(function(btn) {
            const cmd = btn.dataset.cmd;
            let active = false;
            try {
                active = document.queryCommandState(cmd);
            } catch (e) {
                active = false;
            }
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        const codeBtn = this.toolbar.querySelector('button[data-action="wrapCode"]');
        if (codeBtn) {
            const inCode = !!this.getCodeAtSelection();
            codeBtn.classList.toggle('active', inCode);
            codeBtn.setAttribute('aria-pressed', inCode ? 'true' : 'false');
        }

        this.refreshHistoryButtons();
        this.updateStatusBar();
        this.refreshTableMenuState();
    };

    HtmlEditor.prototype.updateToolbarState = function() {
        const disable = this.sourceMode;
        this.toolbar.querySelectorAll('button, select').forEach(function(el) {
            const action = el.dataset.action;
            el.disabled = disable && action !== 'toggleSource' && action !== 'formatSource';
        });

        if (this.sourceGroup) {
            this.sourceGroup.classList.toggle('d-none', !disable);
        }

        if (disable) {
            this.toolbar.querySelectorAll('button.active').forEach(function(btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            this.refreshHistoryButtons();
            this.updateStatusBar();
        } else {
            this.refreshToolbarState();
        }

        const sourceBtn = this.toolbar.querySelector('button[data-action="toggleSource"]');
        if (sourceBtn) {
            sourceBtn.classList.toggle('active', disable);
            sourceBtn.setAttribute('aria-pressed', disable ? 'true' : 'false');
        }
    };

    HtmlEditor.prototype.sync = function() {
        if (!this.sourceMode) {
            this.textarea.value = this.body.innerHTML;
        }
    };

    HtmlEditor.prototype.destroy = function() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.cancelHistoryCommit();
        if (this.sourceRenderFrame) {
            cancelAnimationFrame(this.sourceRenderFrame);
            this.sourceRenderFrame = null;
        }
        if (this.sourceObserver) {
            this.sourceObserver.disconnect();
            this.sourceObserver = null;
        }
        document.removeEventListener('selectionchange', this.onSelectionChange);
        if (this.form && this.onSubmit) {
            this.form.removeEventListener('submit', this.onSubmit);
        }
        if (this.body) {
            this.body.removeEventListener('keydown', this.onKeyDown);
            this.body.removeEventListener('beforeinput', this.onBeforeInput);
        }
        if (this.textarea) {
            this.textarea.removeEventListener('input', this.onSourceInput);
            this.textarea.removeEventListener('scroll', this.onSourceScroll);
            this.textarea.removeEventListener('keydown', this.onSourceKeyDown);
        }
        delete window.BrammoEditor.instances[this.id];
    };

    return HtmlEditor;
})();

window.BrammoEditor = window.BrammoEditor || { instances: {} };
window.BrammoEditor.HtmlEditor = HtmlEditor;

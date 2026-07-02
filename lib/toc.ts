
export interface TocItem {
    text: string;
    id: string;
    level: number;
}

export function extractToc(content: string | null | undefined): TocItem[] {
    if (!content) return [];
    
    try {
        let data: any;
        if (typeof content === 'string') {
            if (!content.trim().startsWith('{')) return [];
            data = JSON.parse(content);
        } else {
            data = content;
        }

        const headings: TocItem[] = [];
        
        const traverse = (node: any) => {
            if (!node) return;

            if (node.type === 'heading' && node.tag === 'h2') {
                const text = node.children
                    ?.filter((child: any) => child.type === 'text')
                    .map((child: any) => child.text)
                    .join('') || '';
                
                if (text) {
                    const id = text
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w-]/g, '');
                    
                    headings.push({
                        text,
                        id,
                        level: parseInt(node.tag.replace('h', ''))
                    });
                }
            }
            
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(traverse);
            }
        };
        
        if (data && data.root) {
            traverse(data.root);
        }
        
        return headings;
    } catch (e) {
        console.error("Error extracting TOC:", e);
        return [];
    }
}

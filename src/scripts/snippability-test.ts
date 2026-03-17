/**
 * Snippability Testing Script
 * 
 * Run with: npx tsx src/scripts/snippability-test.ts
 * 
 * This script extracts the "stripped" version of a page to help identify
 * if content makes sense out of context (useful for AI search optimization).
 */

interface SnippetResult {
    title: string;
    headings: string[];
    paragraphs: string[];
    lists: string[];
    tables: string[];
    totalWords: number;
}

function extractMainContent(html: string): SnippetResult {
    const result: SnippetResult = {
        title: '',
        headings: [],
        paragraphs: [],
        lists: [],
        tables: [],
        totalWords: 0
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const titleEl = tempDiv.querySelector('h1');
    if (titleEl) {
        result.title = titleEl.textContent || '';
    }

    const h2s = tempDiv.querySelectorAll('h2');
    h2s.forEach(h2 => {
        const text = h2.textContent?.trim();
        if (text) result.headings.push(text);
    });

    const h3s = tempDiv.querySelectorAll('h3');
    h3s.forEach(h3 => {
        const text = h3.textContent?.trim();
        if (text) result.headings.push(text);
    });

    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
        const text = p.textContent?.trim();
        if (text && text.length > 20) {
            result.paragraphs.push(text);
        }
    });

    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
        const text = li.textContent?.trim();
        if (text) result.lists.push(text);
    });

    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
        const rows: string[] = [];
        table.querySelectorAll('tr').forEach(tr => {
            const cells: string[] = [];
            tr.querySelectorAll('th, td').forEach(cell => {
                cells.push(cell.textContent?.trim() || '');
            });
            if (cells.length > 0) {
                rows.push(cells.join(' | '));
            }
        });
        if (rows.length > 0) {
            result.tables.push(rows.join('\n'));
        }
    });

    const allText = [
        result.title,
        ...result.headings,
        ...result.paragraphs,
        ...result.lists,
        ...result.tables.join('\n')
    ].join(' ');

    result.totalWords = allText.split(/\s+/).filter(w => w.length > 0).length;

    return result;
}

function printSnippabilityReport(result: SnippetResult, url: string): void {
    console.log('\n' + '='.repeat(60));
    console.log('SNIPPABILITY REPORT');
    console.log('='.repeat(60));
    console.log(`URL: ${url}`);
    console.log(`Total Words: ${result.totalWords}`);
    console.log('='.repeat(60));

    if (result.title) {
        console.log('\n📝 TITLE:');
        console.log(`  ${result.title}`);
    }

    if (result.headings.length > 0) {
        console.log('\n📋 HEADINGS (h2, h3):');
        result.headings.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
    }

    if (result.paragraphs.length > 0) {
        console.log('\n📄 SAMPLE PARAGRAPHS (first 3):');
        result.paragraphs.slice(0, 3).forEach((p, i) => {
            const truncated = p.length > 150 ? p.substring(0, 150) + '...' : p;
            console.log(`  ${i + 1}. ${truncated}`);
        });
        if (result.paragraphs.length > 3) {
            console.log(`  ... and ${result.paragraphs.length - 3} more paragraphs`);
        }
    }

    if (result.lists.length > 0) {
        console.log('\n📝 LIST ITEMS (first 5):');
        result.lists.slice(0, 5).forEach((item, i) => {
            console.log(`  • ${item}`);
        });
        if (result.lists.length > 5) {
            console.log(`  ... and ${result.lists.length - 5} more items`);
        }
    }

    if (result.tables.length > 0) {
        console.log('\n📊 TABLES DETECTED:');
        result.tables.forEach((table, i) => {
            console.log(`\n  Table ${i + 1}:`);
            console.log(table.split('\n').map(row => `    ${row}`).join('\n'));
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('AI SEARCH READINESS CHECK:');
    console.log('='.repeat(60));
    
    const issues: string[] = [];
    
    if (!result.title) {
        issues.push('❌ No h1 title found');
    }
    if (result.headings.length === 0) {
        issues.push('⚠️  No h2/h3 headings found');
    }
    if (result.paragraphs.length === 0) {
        issues.push('⚠️  No substantial paragraphs found');
    }
    if (result.totalWords < 300) {
        issues.push('⚠️  Content may be too thin for featured snippets');
    }
    
    if (issues.length === 0) {
        console.log('✅ Page looks good for AI search inclusion!');
    } else {
        issues.forEach(issue => console.log(issue));
    }
    
    console.log('='.repeat(60) + '\n');
}

export {};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const html = document.body.innerHTML;
    const result = extractMainContent(html);
    printSnippabilityReport(result, window.location.href);
}
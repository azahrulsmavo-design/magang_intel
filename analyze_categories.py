
import json
from collections import Counter

# Load data
with open('web/public/data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def enrich_category(pos, current_cat):
    if not pos: return "Lainnya"
    p = pos.lower()
    
    # EXISTING LOGIC FROM page.tsx (converted to Python)
    if any(x in p for x in ['android', 'ios', 'mobile', 'flutter', 'react native', 'kotlin', 'swift']): return 'Mobile Development'
    if any(x in p for x in ['frontend', 'backend', 'full stack', 'web', 'software', 'website', 'programmer', 'developer', 'react', 'vue', 'node', 'laravel', 'php', 'golang']): return 'Web & Software Dev'
    if any(x in p for x in ['ui/ux', 'product design', 'user interface', 'user experience', 'figma']): return 'UI/UX Design'
    if any(x in p for x in ['data', 'analyst', 'science', 'ai', 'machine learning', 'ml', 'deep learning', 'nlp', 'big data', 'statistik']): return 'Data & AI'
    if any(x in p for x in ['network', 'security', 'cyber', 'infra', 'sysadmin', 'cloud', 'devops', 'jaringan', 'server']): return 'Network & Security'
    
    if any(x in p for x in ['social media', 'content', 'copywrit', 'creative', 'sosial media', 'kampanye']): return 'Content & Social Media'
    if any(x in p for x in ['marketing', 'market', 'seo', 'brand', 'digital', 'pemasaran', 'iklan']): return 'Marketing & Branding'
    if any(x in p for x in ['sales', 'business dev', 'account', 'penjualan', 'bisnis']): return 'Sales & BizDev'
    
    if any(x in p for x in ['finance', 'account', 'tax', 'pajak', 'audit', 'akuntansi', 'keuangan']): return 'Finance & Accounting'
    if any(x in p for x in ['admin', 'sekretaris', 'arsip', 'data entry', 'general affair', 'operasional kantor']): return 'Administration'
    if any(x in p for x in ['hr', 'human', 'recruit', 'talent', 'people', 'sumber daya']): return 'Human Resources'
    
    if any(x in p for x in ['graphic', 'desain grafis', 'illustrator', 'video', 'motion', 'editor', 'animator', 'multimedia', 'visual']): return 'Creative Design & Multimedia'
    
    if any(x in p for x in ['operas', 'logistik', 'warehouse', 'supply', 'gudang', 'pengadaan']): return 'Operations & Logistics'
    if any(x in p for x in ['hukum', 'legal', 'law']): return 'Legal'
    
    # If no keyword match
    if current_cat and current_cat not in ['Lainnya', '', 'Other']: return current_cat
    
    return 'Lainnya'

# Counters
categories = Counter()
uncategorized_titles = Counter()

total = len(data)

for item in data:
    cat = enrich_category(item.get('posisi', ''), item.get('kategori_posisi', ''))
    categories[cat] += 1
    if cat == 'Lainnya':
        uncategorized_titles[item.get('posisi', '')] += 1

print(f"Total Items: {total}")
print("\nCategory Distribution:")
for cat, count in categories.most_common():
    print(f"{cat}: {count} ({count/total*100:.1f}%)")

print("\nTop 50 Uncategorized Titles (Lainnya):")
for title, count in uncategorized_titles.most_common(50):
    print(f"{count}: {title}")

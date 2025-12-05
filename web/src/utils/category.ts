
/**
 * Enriches the category of a job position based on its title and existing category.
 * This helps reduce the number of "Lainnya" or "Other" categories by identifying
 * specific keywords in the position title.
 * 
 * @param pos - The job position title (e.g., "Frontend Developer")
 * @param currentCat - The existing category from the data source
 * @returns A more specific category name
 */
export const enrichCategory = (pos: string, currentCat: string): string => {
    if (!pos) return 'Lainnya';
    const p = pos.toLowerCase();

    // 1. Tech & Digital
    if (p.includes('android') || p.includes('ios') || p.includes('mobile') || p.includes('flutter') || p.includes('react native') || p.includes('kotlin') || p.includes('swift')) return 'Mobile Development';
    if (p.includes('frontend') || p.includes('backend') || p.includes('full stack') || p.includes('web') || p.includes('software') || p.includes('website') || p.includes('programmer') || p.includes('developer') || p.includes('application')) return 'Web & Software Dev';
    if (p.includes('ui/ux') || p.includes('product design') || p.includes('user interface') || p.includes('experience') || p.includes('figma')) return 'UI/UX Design';
    if (p.includes('data') || p.includes('analyst') || p.includes('science') || p.includes('ai') || p.includes('machine learning') || p.includes('statistics') || p.includes('statistik') || p.includes('big data')) return 'Data & AI';
    if (p.includes('network') || p.includes('security') || p.includes('cyber') || p.includes('infra') || p.includes('sysadmin') || p.includes('devops') || p.includes('cloud') || p.includes('jaringan') || p.includes('server')) return 'Network & Security';
    if (p.includes('it support') || p.includes('helpdesk') || p.includes('teknisi komputer') || p.includes('pranata komputer') || p.includes('information technology') || p.includes('teknik informatika')) return 'IT Support & Infra';

    // 2. Creative & Content
    if (p.includes('graphic') || p.includes('desain grafis') || p.includes('illustrator') || p.includes('video') || p.includes('motion') || p.includes('editor') || p.includes('animator') || p.includes('multimedia') || p.includes('visual') || p.includes('art director')) return 'Creative Design & Multimedia';
    if (p.includes('social media') || p.includes('content') || p.includes('copywrit') || p.includes('creative') || p.includes('sosial media') || p.includes('kampanye') || p.includes('journalist') || p.includes('reporter')) return 'Content & Social Media';

    // 3. Business, Marketing & Sales
    if (p.includes('marketing') || p.includes('market') || p.includes('seo') || p.includes('brand') || p.includes('digital') || p.includes('pemasaran') || p.includes('iklan') || p.includes('advertising') || p.includes('humas') || p.includes('public relation') || p.includes('hubungan masyarakat') || p.includes('pranata humas')) return 'Marketing, Branding & PR';
    if (p.includes('sales') || p.includes('business dev') || p.includes('account') || p.includes('penjualan') || p.includes('bisnis') || p.includes('niaga') || p.includes('commercial')) return 'Sales & BizDev';
    if (p.includes('finance') || p.includes('account') || p.includes('tax') || p.includes('pajak') || p.includes('audit') || p.includes('akuntansi') || p.includes('keuangan') || p.includes('fiskal') || p.includes('perbankan')) return 'Finance & Accounting';
    if (p.includes('hr') || p.includes('human') || p.includes('recruit') || p.includes('talent') || p.includes('people') || p.includes('sumber daya') || p.includes('personalia') || p.includes('training') || p.includes('diklat')) return 'Human Resources';

    // 4. Public Sector & Administration (Huge chunk of data)
    if (p.includes('pembina') || p.includes('penelaah') || p.includes('pengelola') || p.includes('pranata') || p.includes('analis kebijakan') || p.includes('fungsional') || p.includes('arsip') || p.includes('pustaka') || p.includes('perencana') || p.includes('pemerintahan') || p.includes('protokol') || p.includes('ajudan')) return 'Public Sector & Administration';
    if (p.includes('admin') || p.includes('sekretaris') || p.includes('data entry') || p.includes('general affair') || p.includes('operasional kantor') || p.includes('clerk') || p.includes('receptionist') || p.includes('front office') || p.includes('frontliner') || p.includes('duta layanan')) return 'General Admin & Support';

    // 5. Engineering & Technical
    if (p.includes('teknisi') || p.includes('engineer') || p.includes('mekanik') || p.includes('listrik') || p.includes('electro') || p.includes('mesin') || p.includes('civil') || p.includes('sipil') || p.includes('drafter') || p.includes('architecture') || p.includes('arsitek') || p.includes('konstruksi') || p.includes('planologi') || p.includes('lingkungan')) return 'Engineering & Construction';
    if (p.includes('quality') || p.includes('qc') || p.includes('qa') || p.includes('penguji')) return 'Quality Control & Assurance';

    // 6. Health & Science
    if (p.includes('dokter') || p.includes('medis') || p.includes('perawat') || p.includes('ners') || p.includes('bidan') || p.includes('farmasi') || p.includes('apoteker') || p.includes('gizi') || p.includes('kesehatan') || p.includes('laboratorium') || p.includes('psikolog') || p.includes('terapis') || p.includes('radiografer') || p.includes('sanitarian')) return 'Health & Medical';
    if (p.includes('research') || p.includes('peneliti') || p.includes('enumerator') || p.includes('surveyor') || p.includes('laboran') || p.includes('biologi') || p.includes('kimia') || p.includes('fisika')) return 'Science & Research';

    // 7. Operations, Logistics & Services
    if (p.includes('operas') || p.includes('logistik') || p.includes('warehouse') || p.includes('supply') || p.includes('gudang') || p.includes('pengadaan') || p.includes('inventaris') || p.includes('purchasing') || p.includes('procurement') || p.includes('ppic')) return 'Operations & Logistics';
    if (p.includes('hotel') || p.includes('cook') || p.includes('chef') || p.includes('kitchen') || p.includes('barista') || p.includes('waiter') || p.includes('room') || p.includes('housekeeping') || p.includes('pariwisata') || p.includes('tour')) return 'Hospitality & Tourism';
    if (p.includes('hukum') || p.includes('legal') || p.includes('law') || p.includes('advokasi') || p.includes('perundang')) return 'Legal';
    if (p.includes('guru') || p.includes('pengajar') || p.includes('instruktur') || p.includes('tutor') || p.includes('kurikulum') || p.includes('pendidikan') || p.includes('dosen')) return 'Education & Training';

    // If no keyword match, keep existing or fallback to Lainnya, BUT verify existing is not 'Other'
    if (currentCat && currentCat !== 'Lainnya' && currentCat !== 'Other' && currentCat !== '') return currentCat;

    return 'Lainnya';
};

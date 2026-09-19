import { Link } from '@inertiajs/react';
import type { PaginationLink } from '@/types/rbac';

type Props = {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export default function Pagination({ links, from, to, total }: Props) {
    return (
        <div className="rbac-pagination">
            <span>Showing {from ?? 0}–{to ?? 0} of {total}</span>
            {links.length > 3 && (
                <nav aria-label="Pagination" className="rbac-pagination-links">
                    {links.map((link, index) => {
                        const label = link.label.includes('Previous') ? 'Previous'
                            : link.label.includes('Next') ? 'Next' : link.label;
                        return link.url
                            ? <Link key={index} href={link.url} className={link.active ? 'active' : ''} aria-current={link.active ? 'page' : undefined}>{label}</Link>
                            : <span key={index} className="disabled">{label}</span>;
                    })}
                </nav>
            )}
        </div>
    );
}

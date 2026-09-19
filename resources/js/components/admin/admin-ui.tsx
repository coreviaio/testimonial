import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronDown, KeyRound, MoreHorizontal, Plus, Search, Shield, Trash2, Users, X } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import FieldError from '@/components/admin/field-error';
import type { Paginated, RbacPageProps } from '@/types/rbac';
import '../../../css/admin.css';

type Section = 'users' | 'roles' | 'permissions';
const sections = [
    { title: 'Users', href: '/admin/users', permission: 'users.manage', icon: Users },
    { title: 'Roles', href: '/admin/roles', permission: 'roles.manage', icon: Shield },
    { title: 'Permissions', href: '/admin/permissions', permission: 'permissions.manage', icon: KeyRound },
] as const;

export function AdminPage({
                              section, title, description, action, children,
                          }: {
    section: Section;
    title: string;
    description: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    const { auth } = usePage<RbacPageProps>().props;
    const visibleSections = sections.filter((item) => auth.permissions?.includes(item.permission));

    return (
        <>
            <Head title={title} />
            <main className="rbac">
                <div className="rbac-container">
                    <div className="rbac-hero">
                        <div>
                            <span className="rbac-eyebrow"><Shield size={14} /> ACCESS CONTROL / {section.toUpperCase()}</span>
                            <h1>{title}</h1>
                            <p>{description}</p>
                        </div>
                        {action && <div className="rbac-hero-action">{action}</div>}
                    </div>
                    {visibleSections.length > 1 && (
                        <nav className="rbac-tabs" aria-label="Access control pages">
                            {visibleSections.map(({ title: label, href, icon: Icon }) => (
                                <Link key={href} href={href} className={label.toLowerCase() === section ? 'rbac-tab active' : 'rbac-tab'}>
                                    <Icon size={16} /> {label}
                                </Link>
                            ))}
                        </nav>
                    )}
                    <FlashMessages />
                    {children}
                </div>
            </main>
        </>
    );
}

type Column<RecordType> = { heading: string; render: (record: RecordType) => ReactNode };

export function AdminList<RecordType extends { id: number; name: string }>({
   section, title, description, collection, filters, indexHref,
   createHref, createLabel, columns, editHref, onDelete, canDelete, emptyText,
}: {
    section: Section;
    title: string;
    description: string;
    collection: Paginated<RecordType>;
    filters: { search?: string | null };
    indexHref: string;
    createHref: string;
    createLabel: string;
    columns: Column<RecordType>[];
    editHref: (record: RecordType) => string;
    onDelete: (record: RecordType) => void;
    canDelete: (record: RecordType) => string | null;
    emptyText: string;
}) {
    const appliedSearch = filters.search ?? '';
    const [search, setSearch] = useState(appliedSearch);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setSearch(appliedSearch);
    }, [appliedSearch]);

    function visit(value: string) {
        const term = value.trim();
        setSearching(true);
        router.get(indexHref, term ? { search: term } : {}, {
            replace: true,
            preserveState: false,
            preserveScroll: true,
            onFinish: () => setSearching(false),
        });
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        visit(search);
    }

    function clear() {
        setSearch('');
        if (appliedSearch) visit('');
    }

    return (
        <AdminPage
            section={section}
            title={title}
            description={description}
            action={<Link href={createHref} className="rbac-button rbac-button-primary"><Plus size={17} /> {createLabel}</Link>}
        >
            <div className="rbac-summary">
                <div className="rbac-summary-icon">{section === 'users' ? <Users /> : section === 'roles' ? <Shield /> : <KeyRound />}</div>
                <div><strong>{collection.total}</strong><span>{appliedSearch ? 'Matching records' : `Total ${section}`}</span></div>
                <div className="rbac-summary-divider" />
                <div><strong>{collection.data.length}</strong><span>On this page</span></div>
            </div>
            <section className="rbac-card">
                <header className="rbac-card-heading">
                    <div><span className="rbac-kicker">DIRECTORY</span><h2>{title}</h2><p>Find records and manage access in one place.</p></div>
                    <span className="rbac-count">{collection.total} records</span>
                </header>
                <form className="rbac-toolbar" onSubmit={submit} role="search">
                    <div className="rbac-search">
                        <Search size={17} aria-hidden="true" />
                        <input
                            aria-label={`Search ${section}`}
                            type="search"
                            placeholder={section === 'users' ? 'Search by name or email' : 'Search by name or identifier'}
                            value={search}
                            maxLength={100}
                            onChange={(event) => {
                                const value = event.target.value;
                                setSearch(value);
                                if (!value && appliedSearch) visit('');
                            }}
                        />
                    </div>
                    <button type="submit" className="rbac-button rbac-button-secondary" disabled={searching}>Search</button>
                    {(search || appliedSearch) && (
                        <button type="button" className="rbac-clear" onClick={clear} disabled={searching}><X size={15} /> Clear</button>
                    )}
                </form>
                <div className="rbac-table-scroll">
                    <table className="rbac-table">
                        <thead><tr>{columns.map((column) => <th key={column.heading}>{column.heading}</th>)}<th className="rbac-actions">Actions</th></tr></thead>
                        <tbody>
                        {collection.data.map((record) => (
                            <tr key={record.id}>
                                {columns.map((column) => <td key={column.heading} data-label={column.heading}>{column.render(record)}</td>)}
                                <td className="rbac-actions" data-label="Actions">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="rbac-menu-trigger" aria-label={`Actions for ${record.name}`}><MoreHorizontal size={19} /></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rbac-menu">
                                            <DropdownMenuItem asChild><Link href={editHref(record)}>Edit details</Link></DropdownMenuItem>
                                            <DropdownMenuItem
                                                variant="destructive"
                                                disabled={canDelete(record) !== null}
                                                onSelect={() => onDelete(record)}
                                            >
                                                <Trash2 size={15} /> Delete
                                            </DropdownMenuItem>
                                            {canDelete(record) && <p className="rbac-menu-note">{canDelete(record)}</p>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {collection.data.length === 0 && (
                            <tr><td colSpan={columns.length + 1} className="rbac-empty">
                                <Search size={24} /><strong>No {section} found</strong>
                                <span>{appliedSearch ? 'Try a different search or clear the filter.' : emptyText}</span>
                                {appliedSearch && <button type="button" className="rbac-button rbac-button-secondary" onClick={clear}>Clear search</button>}
                            </td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <Pagination links={collection.links} from={collection.from} to={collection.to} total={collection.total} />
            </section>
        </AdminPage>
    );
}

export function AdminForm({
                              section, title, description, backHref, editing, processing, onSubmit, children, guidance,
                          }: {
    section: Section;
    title: string;
    description: string;
    backHref: string;
    editing: boolean;
    processing: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    children: ReactNode;
    guidance: ReactNode;
}) {
    return (
        <AdminPage section={section} title={title} description={description}
                   action={<Link className="rbac-button rbac-button-outline" href={backHref}><ArrowLeft size={16} /> All {section}</Link>}>
            <form className="rbac-form-grid" onSubmit={onSubmit}>
                <section className="rbac-card rbac-form-main">{children}</section>
                <aside className="rbac-card rbac-form-side"><span className="rbac-kicker">GOOD TO KNOW</span>{guidance}</aside>
                <div className="rbac-form-footer">
                    <Link href={backHref} className="rbac-button rbac-button-outline">Cancel</Link>
                    <button type="submit" className="rbac-button rbac-button-primary" disabled={processing}>
                        {processing ? 'Saving…' : editing ? 'Save changes' : `Create ${section.slice(0, -1)}`}
                    </button>
                </div>
            </form>
        </AdminPage>
    );
}

export function FormHeading({ title, description }: { title: string; description: string }) {
    return <div className="rbac-form-heading"><h2>{title}</h2><p>{description}</p></div>;
}

export function TextField({
                              id, label, error, hint, required = false, ...props
                          }: { id: string; label: string; error?: string; hint?: string; required?: boolean } &
    React.InputHTMLAttributes<HTMLInputElement>) {
    return <div className="rbac-field">
        <label htmlFor={id}>{label}{required && <span className="rbac-required"> *</span>}</label>
        <input id={id} className="rbac-input" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} required={required} {...props} />
        {hint && <small className="rbac-hint">{hint}</small>}
        <div id={`${id}-error`}><FieldError message={error} /></div>
    </div>;
}

export function TextAreaField({ id, label, error, ...props }: {
    id: string; label: string; error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <div className="rbac-field">
        <label htmlFor={id}>{label}</label>
        <textarea id={id} className="rbac-input rbac-textarea" aria-invalid={Boolean(error)} {...props} />
        <FieldError message={error} />
    </div>;
}

type Option = { id: number; name: string; slug: string };
export function MultiSelect({
                                label, options, selected, onChange, error,
                            }: {
    label: string; options: Option[]; selected: number[];
    onChange: (ids: number[]) => void; error?: string;
}) {
    const dropdown = useRef<HTMLDetailsElement>(null);
    const [search, setSearch] = useState('');
    useEffect(() => {
        function dismiss(event: PointerEvent) {
            if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
        }
        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape' && dropdown.current) dropdown.current.open = false;
        }
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
    }, []);
    const matches = options.filter((option) => `${option.name} ${option.slug}`.toLowerCase().includes(search.toLowerCase()));
    const chosen = options.filter((option) => selected.includes(option.id));

    return <div className="rbac-field">
        <span className="rbac-label">{label}{label === 'Assigned roles' && <span className="rbac-required"> *</span>}</span>
        <details className="rbac-select" ref={dropdown}>
            <summary className="rbac-select-trigger" aria-label={`Choose ${label.toLowerCase()}`}>
                <span>{chosen.length ? `${chosen.length} selected · ${chosen.slice(0, 2).map((option) => option.name).join(', ')}` : `Select ${label.toLowerCase()}`}</span>
                <ChevronDown size={17} />
            </summary>
            <div className="rbac-select-panel">
                <div className="rbac-select-search"><Search size={15} /><input aria-label={`Find ${label.toLowerCase()}`} placeholder="Find an option..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                <div className="rbac-select-controls">
                    <button type="button" onClick={() => onChange(Array.from(new Set([...selected, ...matches.map((option) => option.id)])))}>Select shown</button>
                    <button type="button" onClick={() => onChange([])}>Clear all</button>
                </div>
                <div className="rbac-select-options">
                    {matches.map((option) => <label key={option.id} className="rbac-option">
                        <input type="checkbox" checked={selected.includes(option.id)} onChange={(event) =>
                            onChange(event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))
                        } />
                        <span><strong>{option.name}</strong><small>{option.slug}</small></span>
                        {selected.includes(option.id) && <Check size={15} className="rbac-option-check" />}
                    </label>)}
                    {matches.length === 0 && <p className="rbac-option-empty">No matching options.</p>}
                </div>
            </div>
        </details>
        {chosen.length > 0 && <div className="rbac-chips">{chosen.map((option) =>
            <button key={option.id} type="button" onClick={() => onChange(selected.filter((id) => id !== option.id))} title={`Remove ${option.name}`}>
                {option.name} <X size={13} />
            </button>,
        )}</div>}
        <FieldError message={error} />
    </div>;
}

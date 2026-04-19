'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Hammer, ShieldCheck, LogOut, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [{ href: '/builds', label: 'Builds', icon: Hammer }];

const ADMIN_ITEMS = [
	{ href: '/admin', label: 'Admin', icon: ShieldCheck },
	{ href: '/monitor', label: 'Monitor', icon: Activity },
];

export default function Sidebar() {
	const pathname = usePathname();
	const { user, logout } = useAuth();

	const allItems =
		user?.role === 'admin' ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

	return (
		<aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
			{/* Logo */}
			<div className="flex h-16 items-center gap-2.5 px-5">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
					<Image
						src="/favicon-32x32.png"
						alt="UploadDoc Logo"
						width={32}
						height={32}
					/>
				</div>
				<div className="flex flex-col leading-tight">
					<span className="text-sm font-semibold text-sidebar-accent-foreground">
						UploadDoc
					</span>
					<span className="text-xs text-sidebar-foreground/60">
						Custom Expo Server
					</span>
				</div>
			</div>

			<Separator className="bg-sidebar-border" />

			{/* Navigation */}
			<nav className="flex-1 space-y-1 px-3 py-4">
				{allItems.map((item) => {
					const isActive = pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
							)}>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			{/* User + Logout */}
			<div className="border-t border-sidebar-border p-4">
				<div className="mb-3 truncate text-sm text-sidebar-foreground/70">
					{user?.email}
				</div>
				<Button
					id="sidebar-logout"
					variant="ghost"
					size="sm"
					className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
					onClick={logout}>
					<LogOut className="h-4 w-4" />
					Sign out
				</Button>
			</div>
		</aside>
	);
}

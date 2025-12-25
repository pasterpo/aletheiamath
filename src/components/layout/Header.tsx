import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const baseNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/aletheia-rating', label: 'Aletheia Rating' },
  { href: '/learn', label: 'Learn' },
  { href: '/problems', label: 'Problems' },
  { href: '/duels', label: 'Duels' },
  { href: '/discussion', label: 'Discussion' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/imo-2027', label: 'IMO 2027' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: notifications } = useNotifications();

  const navLinks = user ? [...baseNavLinks, { href: '/admin', label: 'Admin' }] : baseNavLinks;

  const isActive = (path: string) => location.pathname === path;

  const totalNotifications = notifications?.total || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg">α</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              AletheiaMath
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons & Notifications - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Friends Link */}
              <Link to="/friends">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                </Button>
              </Link>

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {totalNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {notifications?.friendRequests ? (
                    <DropdownMenuItem asChild>
                      <Link to="/friends" className="flex justify-between">
                        <span>Friend Requests</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {notifications.friendRequests}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {notifications?.unreadMessages ? (
                    <DropdownMenuItem asChild>
                      <Link to="/friends" className="flex justify-between">
                        <span>Unread Messages</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {notifications.unreadMessages}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {notifications?.duelChallenges ? (
                    <DropdownMenuItem asChild>
                      <Link to="/duels" className="flex justify-between">
                        <span>Duel Challenges</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {notifications.duelChallenges}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {totalNotifications === 0 && (
                    <DropdownMenuItem disabled>
                      No new notifications
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="btn-premium">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border my-2 pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to="/friends"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Friends
                    {notifications?.unreadMessages ? (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {notifications.unreadMessages}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 rounded-lg text-sm font-medium text-left text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
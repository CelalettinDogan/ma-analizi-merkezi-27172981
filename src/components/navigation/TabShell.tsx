import React, { useRef, useEffect, useCallback, useState, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Index stays eager (first screen), rest are lazy loaded for bundle optimization
import Index from '@/pages/Index';
const Live = React.lazy(() => import('@/pages/Live'));
const Chat = React.lazy(() => import('@/pages/Chat'));
const Standings = React.lazy(() => import('@/pages/Standings'));
const Premium = React.lazy(() => import('@/pages/Premium'));
const Profile = React.lazy(() => import('@/pages/Profile'));

const TabFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const TAB_PATHS = ['/', '/live', '/chat', '/standings', '/premium', '/profile'] as const;
type TabPath = (typeof TAB_PATHS)[number];

const TAB_COMPONENTS: Record<TabPath, React.ComponentType> = {
  '/': Index,
  '/live': Live,
  '/chat': Chat,
  '/standings': Standings,
  '/premium': Premium,
  '/profile': Profile,
};

function isTabPath(path: string): path is TabPath {
  return TAB_PATHS.includes(path as TabPath);
}

const TabShell: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const activeTab: TabPath | null = isTabPath(location.pathname) ? location.pathname : null;
  const prevTabRef = useRef<TabPath | null>(activeTab);
  const scrollPositions = useRef<Map<TabPath, number>>(new Map());
  const tabRefs = useRef<Map<TabPath, HTMLDivElement | null>>(new Map());

  // Track whether we've done the initial mount (skip animation on first render)
  // Lazy mount: only mount tabs that have been visited at least once
  const [visitedTabs, setVisitedTabs] = useState<Set<TabPath>>(new Set(['/']));

  useEffect(() => {
    if (activeTab && !visitedTabs.has(activeTab)) {
      setVisitedTabs(prev => new Set(prev).add(activeTab));
    }
  }, [activeTab]);

  const [initialRender, setInitialRender] = useState(true);
  useEffect(() => {
    if (initialRender) {
      const t = requestAnimationFrame(() => setInitialRender(false));
      return () => cancelAnimationFrame(t);
    }
  }, [initialRender]);

  // Save scroll of previous tab, restore scroll of new tab
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev && prev !== activeTab) {
      const prevEl = tabRefs.current.get(prev);
      if (prevEl) {
        scrollPositions.current.set(prev, prevEl.scrollTop);
      }
    }

    if (activeTab) {
      const el = tabRefs.current.get(activeTab);
      if (el) {
        const saved = scrollPositions.current.get(activeTab) ?? 0;
        requestAnimationFrame(() => {
          el.scrollTop = saved;
        });
      }
    }

    prevTabRef.current = activeTab;
  }, [activeTab]);

  const setTabRef = useCallback((path: TabPath) => (el: HTMLDivElement | null) => {
    tabRefs.current.set(path, el);
  }, []);

  // Auth guard — redirect to login (must be before early returns)
  // Skip redirect for public routes like /callback, /reset-password, /auth
  const PUBLIC_ROUTES = ['/auth', '/callback', '/reset-password', '/terms', '/privacy', '/delete-account'];
  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_ROUTES.includes(location.pathname)) {
      navigate('/auth', { replace: true });
    }
  }, [isLoading, user, navigate, location.pathname]);

  // Auth guard — loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If current path is not a tab, hide entire shell (non-tab route is active)
  if (!activeTab) {
    return (
    <div style={{ display: 'none' }}>
        {TAB_PATHS.filter(path => visitedTabs.has(path)).map((path) => {
          const Component = TAB_COMPONENTS[path];
          return (
            <div key={path} ref={setTabRef(path)}>
              <Component />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {TAB_PATHS.map((path) => {
        const Component = TAB_COMPONENTS[path];
        const isActive = path === activeTab;
        const wasVisited = visitedTabs.has(path);

        // Don't mount tabs that have never been visited
        if (!wasVisited) return null;

        return (
          <div
            key={path}
            ref={setTabRef(path)}
            className="bg-background"
            style={{
              display: isActive ? 'block' : 'none',
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'translateY(0)' : 'translateY(4px)',
              transition: initialRender ? 'none' : 'opacity 0.2s ease-out, transform 0.2s ease-out',
              height: 'var(--app-height, 100vh)',
              overflow: 'hidden',
            }}
          >
            <ErrorBoundary>
              <Suspense fallback={<TabFallback />}>
                <Component />
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      })}
    </>
  );
};

export default TabShell;

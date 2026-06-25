import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api, getToken, clearToken, type User, type Post, type Review } from '@/lib/api';
import Header from '@/components/Header';
import PageHome from '@/components/PageHome';
import PageFeed from '@/components/PageFeed';
import PageReviews from '@/components/PageReviews';
import PageCabinet from '@/components/PageCabinet';
import PageSettings from '@/components/PageSettings';

type Tab = 'home' | 'feed' | 'reviews' | 'cabinet' | 'settings';

export default function Index() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('novapc_theme') as 'dark' | 'light') || 'dark'
  );
  const [tab, setTab] = useState<Tab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('novapc_theme', theme);
  }, [theme]);

  const loadFeed = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([api.getPosts(), api.getReviews()]);
      setPosts(p.posts);
      setReviews(r.reviews);
    } catch (e) {
      // тихо
    }
  }, []);

  useEffect(() => {
    loadFeed();
    if (getToken()) {
      api.me().then((d) => setUser(d.user)).catch(() => clearToken());
    }
  }, [loadFeed]);

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      toast('Войдите, чтобы продолжить');
    }
  };

  const canPost = !!user && user.uid >= 1 && user.uid <= 5;

  return (
    <div className="min-h-screen bg-background text-foreground grid-bg relative pb-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background pointer-events-none" />

      <Header
        tab={tab}
        user={user}
        onTabChange={setTab}
        requireAuth={requireAuth}
        onAuthSuccess={(token, u) => {
          setUser(u);
          setTab('cabinet');
          toast.success(`Добро пожаловать, ${u.name}!`);
        }}
      />

      <main className="container relative z-10 py-10">
        {tab === 'home' && (
          <PageHome
            onBuy={() => requireAuth(() => {
              setTab('feed');
              toast.success('Выберите сборку в ленте');
            })}
          />
        )}

        {tab === 'feed' && (
          <PageFeed
            posts={posts}
            canPost={canPost}
            user={user}
            onRequireAuth={() => requireAuth(() => {})}
            onAddPost={async (p) => {
              try {
                const res = await api.addPost(p);
                setPosts([res.post, ...posts]);
                toast.success('Пост опубликован');
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            onDeletePost={async (id) => {
              try {
                await api.deletePost(id);
                setPosts(posts.filter((p) => p.id !== id));
                toast.success('Пост удалён');
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            onBuy={() => requireAuth(() => {})}
          />
        )}

        {tab === 'reviews' && (
          <PageReviews
            reviews={reviews}
            onAdd={(text, rating) => requireAuth(async () => {
              try {
                const res = await api.addReview(text, rating);
                setReviews([res.review, ...reviews]);
                toast.success('Отзыв опубликован');
              } catch (e) {
                toast.error((e as Error).message);
              }
            })}
          />
        )}

        {tab === 'cabinet' && user && (
          <PageCabinet
            user={user}
            onSave={async (name, email) => {
              try {
                const res = await api.updateProfile(name, email);
                setUser(res.user);
                toast.success('Профиль обновлён');
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            onLogout={() => {
              clearToken();
              setUser(null);
              setTab('home');
            }}
          />
        )}

        {tab === 'settings' && (
          <PageSettings theme={theme} setTheme={setTheme} />
        )}
      </main>
    </div>
  );
}
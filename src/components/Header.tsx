import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { api, setToken, type User } from '@/lib/api';

type Tab = 'home' | 'feed' | 'reviews' | 'cabinet' | 'settings';

const NAV: { id: Tab; label: string; icon: string; auth?: boolean }[] = [
  { id: 'home', label: 'Главная', icon: 'House' },
  { id: 'feed', label: 'Лента', icon: 'LayoutGrid' },
  { id: 'reviews', label: 'Отзывы', icon: 'Star' },
  { id: 'cabinet', label: 'Кабинет', icon: 'User', auth: true },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

interface HeaderProps {
  tab: Tab;
  user: User | null;
  onTabChange: (t: Tab) => void;
  requireAuth: (action: () => void) => void;
  onAuthSuccess: (token: string, u: User) => void;
}

export default function Header({ tab, user, onTabChange, requireAuth, onAuthSuccess }: HeaderProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleNav = (n: typeof NAV[number]) => {
    if (n.auth) {
      requireAuth(() => onTabChange(n.id));
    } else {
      onTabChange(n.id);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => onTabChange('home')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-cyan">
              <Icon name="Cpu" className="text-primary-foreground" size={20} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">NOVA<span className="text-primary">PC</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNav(n)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  tab === n.id ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={n.icon} size={16} />
                {n.label}
              </button>
            ))}
          </nav>

          {user ? (
            <button onClick={() => onTabChange('cabinet')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {user.name[0]?.toUpperCase()}
              </div>
              <span className="text-sm hidden sm:block">{user.name}</span>
            </button>
          ) : (
            <Button size="sm" onClick={() => openAuth('register')}>
              Войти
            </Button>
          )}
        </div>

        {/* Вторая строка навигации на мобильных */}
        <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNav(n)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === n.id ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={n.icon} size={14} />
              {n.label}
            </button>
          ))}
        </div>
      </header>

      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onAuth={(token, u) => {
            setToken(token);
            setAuthOpen(false);
            onAuthSuccess(token, u);
          }}
        />
      )}
    </>
  );
}

function AuthModal({ mode, setMode, onClose, onAuth }: {
  mode: 'login' | 'register';
  setMode: (m: 'login' | 'register') => void;
  onClose: () => void;
  onAuth: (token: string, u: User) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      toast.error('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      const res = mode === 'register'
        ? await api.register(name, email, password)
        : await api.login(email, password);
      onAuth(res.token, res.user);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-md p-7 space-y-5 animate-scale-in glow-cyan" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Cpu" className="text-primary-foreground" size={20} />
            </div>
            <span className="font-display font-bold text-lg">NOVA<span className="text-primary">PC</span></span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          {(['register', 'login'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {m === 'register' ? 'Регистрация' : 'Вход'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label>Имя</Label>
              <Input placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Почта</Label>
            <Input type="email" placeholder="you@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Пароль</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
        </div>

        <Button onClick={submit} className="w-full" disabled={loading}>
          {loading ? 'Загрузка...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
        </Button>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Tab = 'home' | 'feed' | 'reviews' | 'cabinet' | 'settings';

interface User {
  uid: number;
  name: string;
  email: string;
  registeredAt: string;
}

interface Post {
  id: number;
  author: string;
  title: string;
  description: string;
  price: string;
  link: string;
  image: string;
}

interface Review {
  id: number;
  author: string;
  text: string;
  rating: number;
}

const initialPosts: Post[] = [
  {
    id: 1,
    author: 'NOVA Team',
    title: 'NOVA Phantom RTX',
    description: 'Игровой монстр: RTX 4080 Super, Ryzen 7 7800X3D, 32 ГБ DDR5. Тянет любую игру в 4K.',
    price: '189 900 ₽',
    link: 'https://example.com',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=900&q=80',
  },
  {
    id: 2,
    author: 'NOVA Team',
    title: 'NOVA Stealth Mini',
    description: 'Компактная сборка для работы и стримов. Тихая, мощная, в стильном корпусе.',
    price: '94 500 ₽',
    link: 'https://example.com',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=900&q=80',
  },
];

const initialReviews: Review[] = [
  { id: 1, author: 'Алексей', text: 'Собрали ПК за 3 дня, всё работает идеально. Кабель-менеджмент — космос!', rating: 5 },
  { id: 2, author: 'Марина', text: 'Помогли с выбором комплектующих под мой бюджет. Очень довольна.', rating: 5 },
];

const NAV: { id: Tab; label: string; icon: string; auth?: boolean }[] = [
  { id: 'home', label: 'Главная', icon: 'House' },
  { id: 'feed', label: 'Лента', icon: 'LayoutGrid' },
  { id: 'reviews', label: 'Отзывы', icon: 'Star' },
  { id: 'cabinet', label: 'Кабинет', icon: 'User', auth: true },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

let uidCounter = 1;

export default function Index() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tab, setTab] = useState<Tab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const requireAuth = (action: () => void) => {
    if (user) action();
    else {
      setAuthMode('login');
      setAuthOpen(true);
      toast('Войдите, чтобы продолжить');
    }
  };

  const canPost = !!user && user.uid >= 1 && user.uid <= 5;

  return (
    <div className="min-h-screen bg-background text-foreground grid-bg relative pb-20 md:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-cyan">
              <Icon name="Cpu" className="text-primary-foreground" size={20} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">NOVA<span className="text-primary">PC</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => (n.auth ? requireAuth(() => setTab(n.id)) : setTab(n.id))}
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
            <button onClick={() => setTab('cabinet')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {user.name[0]?.toUpperCase()}
              </div>
              <span className="text-sm hidden sm:block">{user.name}</span>
            </button>
          ) : (
            <Button size="sm" onClick={() => { setAuthMode('register'); setAuthOpen(true); }}>
              Войти
            </Button>
          )}
        </div>
      </header>

      <main className="container relative z-10 py-10">
        {tab === 'home' && <Home onBuy={() => requireAuth(() => { setTab('feed'); toast.success('Выберите сборку в ленте'); })} />}
        {tab === 'feed' && (
          <Feed
            posts={posts}
            canPost={canPost}
            user={user}
            onRequireAuth={() => requireAuth(() => {})}
            onAddPost={(p) => setPosts([{ ...p, id: Date.now(), author: user!.name }, ...posts])}
            onBuy={() => requireAuth(() => {})}
          />
        )}
        {tab === 'reviews' && (
          <Reviews
            reviews={reviews}
            onAdd={(text, rating) => requireAuth(() => {
              setReviews([{ id: Date.now(), author: user!.name, text, rating }, ...reviews]);
              toast.success('Отзыв опубликован');
            })}
          />
        )}
        {tab === 'cabinet' && user && <Cabinet user={user} onSave={(u) => { setUser(u); toast.success('Профиль обновлён'); }} onLogout={() => { setUser(null); setTab('home'); }} />}
        {tab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl flex justify-around py-2">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => (n.auth ? requireAuth(() => setTab(n.id)) : setTab(n.id))}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${tab === n.id ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Icon name={n.icon} size={18} />
            {n.label}
          </button>
        ))}
      </nav>

      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onAuth={(u) => { setUser(u); setAuthOpen(false); setTab('cabinet'); toast.success(`Добро пожаловать, ${u.name}!`); }}
        />
      )}
    </div>
  );
}

function Home({ onBuy }: { onBuy: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-10 items-center py-10">
        <div className="space-y-6">
          <Badge className="bg-accent text-accent-foreground border-0">// сборка ПК на заказ</Badge>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Собираем <span className="text-primary text-glow">ПК мечты</span> под твои задачи
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Игры, работа, стримы. Подбираем комплектующие, собираем, тестируем и доставляем готовый компьютер.
          </p>
          <div className="flex gap-3">
            <Button size="lg" onClick={onBuy} className="glow-cyan">
              <Icon name="ShoppingCart" size={18} className="mr-2" /> Купить ПК
            </Button>
            <Button size="lg" variant="outline">Каталог</Button>
          </div>
          <div className="flex gap-8 pt-4">
            {[['500+', 'сборок'], ['4.9', 'рейтинг'], ['2 года', 'гарантия']].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-primary">{v}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative animate-scale-in">
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-glow" />
          <img
            src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=900&q=80"
            alt="Gaming PC"
            className="relative rounded-2xl border border-border w-full object-cover aspect-square glow-cyan"
          />
        </div>
      </div>
    </div>
  );
}

function Feed({ posts, canPost, user, onAddPost, onBuy, onRequireAuth }: {
  posts: Post[]; canPost: boolean; user: User | null;
  onAddPost: (p: Omit<Post, 'id' | 'author'>) => void; onBuy: () => void; onRequireAuth: () => void;
}) {
  const [form, setForm] = useState({ title: '', description: '', price: '', link: '', image: '' });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.title || !form.price) { toast.error('Заполните название и цену'); return; }
    onAddPost(form);
    setForm({ title: '', description: '', price: '', link: '', image: '' });
    setOpen(false);
    toast.success('Пост опубликован');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold">Лента сборок</h2>
          <p className="text-muted-foreground text-sm">Готовые конфигурации от команды NOVA</p>
        </div>
        {!user ? (
          <Button variant="outline" onClick={onRequireAuth}><Icon name="Lock" size={16} className="mr-2" />Войти для постов</Button>
        ) : canPost ? (
          <Button onClick={() => setOpen(!open)}><Icon name="Plus" size={16} className="mr-2" />Новый пост</Button>
        ) : (
          <Badge variant="secondary">Постить могут UID 1–5</Badge>
        )}
      </div>

      {open && canPost && (
        <Card className="p-5 space-y-3 border-primary/40 animate-scale-in">
          <Input placeholder="Название сборки" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Цена (напр. 99 900 ₽)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="Ссылка для покупки" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          </div>
          <Input placeholder="URL фото" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <Button onClick={submit} className="w-full">Опубликовать</Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {posts.map((p) => (
          <Card key={p.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="aspect-video overflow-hidden bg-secondary">
              {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">{p.title}</h3>
                <Badge variant="outline" className="text-xs">{p.author}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="font-display text-xl font-bold text-primary">{p.price}</span>
                <Button size="sm" onClick={() => (user ? window.open(p.link, '_blank') : onBuy())}>
                  <Icon name="ShoppingCart" size={14} className="mr-1.5" />Купить
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Reviews({ reviews, onAdd }: { reviews: Review[]; onAdd: (text: string, rating: number) => void }) {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-3xl font-bold">Отзывы</h2>
        <p className="text-muted-foreground text-sm">Что говорят наши клиенты</p>
      </div>

      <Card className="p-5 space-y-3">
        <Label>Оставить отзыв</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Icon name="Star" size={22} className={s <= rating ? 'text-primary fill-primary' : 'text-muted-foreground'} />
            </button>
          ))}
        </div>
        <Textarea placeholder="Ваш отзыв..." value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => { if (!text) { toast.error('Напишите текст'); return; } onAdd(text, rating); setText(''); }}>
          Отправить
        </Button>
      </Card>

      <div className="space-y-4">
        {reviews.map((r) => (
          <Card key={r.id} className="p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{r.author[0]}</div>
                <span className="font-medium">{r.author}</span>
              </div>
              <div className="flex">
                {Array.from({ length: r.rating }).map((_, i) => <Icon key={i} name="Star" size={14} className="text-primary fill-primary" />)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Cabinet({ user, onSave, onLogout }: { user: User; onSave: (u: User) => void; onLogout: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <h2 className="font-display text-3xl font-bold">Личный кабинет</h2>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-cyan">
            {user.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-display text-xl font-bold">{user.name}</div>
            <div className="text-muted-foreground text-sm">{user.email}</div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">UID</div>
            <div className="font-display text-lg font-bold text-primary">#{user.uid}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Дата регистрации</div>
            <div className="font-display text-lg font-bold">{user.registeredAt}</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Имя</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Почта</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={() => onSave({ ...user, name, email })} className="w-full">Сохранить изменения</Button>
        </div>
      </Card>

      <Button variant="outline" onClick={onLogout} className="text-destructive">
        <Icon name="LogOut" size={16} className="mr-2" />Выйти из аккаунта
      </Button>
    </div>
  );
}

function Settings({ theme, setTheme }: { theme: 'dark' | 'light'; setTheme: (t: 'dark' | 'light') => void }) {
  const [notify, setNotify] = useState(true);
  const [news, setNews] = useState(false);

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <h2 className="font-display text-3xl font-bold">Настройки</h2>

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2"><Icon name={theme === 'dark' ? 'Moon' : 'Sun'} size={18} />Тема оформления</div>
            <div className="text-sm text-muted-foreground">{theme === 'dark' ? 'Тёмная' : 'Светлая'} тема</div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2"><Icon name="Bell" size={18} />Уведомления о заказе</div>
            <div className="text-sm text-muted-foreground">Статусы сборки вашего ПК</div>
          </div>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2"><Icon name="Mail" size={18} />Новости и акции</div>
            <div className="text-sm text-muted-foreground">Скидки на сборки и комплектующие</div>
          </div>
          <Switch checked={news} onCheckedChange={setNews} />
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="font-medium flex items-center gap-2"><Icon name="Sparkles" size={18} className="text-primary" />Бонус от NOVA</div>
        <p className="text-sm text-muted-foreground">Реферальная программа: приглашайте друзей и получайте скидку 5% на следующую сборку за каждого.</p>
        <Button variant="outline" size="sm" onClick={() => toast.success('Ссылка скопирована')}>
          <Icon name="Copy" size={14} className="mr-2" />Скопировать реф-ссылку
        </Button>
      </Card>
    </div>
  );
}

function AuthModal({ mode, setMode, onClose, onAuth }: {
  mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void;
  onClose: () => void; onAuth: (u: User) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!email || !password || (mode === 'register' && !name)) {
      toast.error('Заполните все поля');
      return;
    }
    onAuth({
      uid: uidCounter++,
      name: mode === 'register' ? name : email.split('@')[0],
      email,
      registeredAt: new Date().toLocaleDateString('ru-RU'),
    });
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={20} /></button>
        </div>

        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          {(['register', 'login'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
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
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <Button onClick={submit} className="w-full">
          {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
        </Button>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { type User, type Post } from '@/lib/api';

interface PageFeedProps {
  posts: Post[];
  canPost: boolean;
  user: User | null;
  onAddPost: (p: Omit<Post, 'id' | 'author'>) => void;
  onBuy: () => void;
  onRequireAuth: () => void;
}

export default function PageFeed({ posts, canPost, user, onAddPost, onBuy, onRequireAuth }: PageFeedProps) {
  const [form, setForm] = useState({ title: '', description: '', price: '', link: '', image: '' });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.title || !form.price) { toast.error('Заполните название и цену'); return; }
    onAddPost(form);
    setForm({ title: '', description: '', price: '', link: '', image: '' });
    setOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold">Лента сборок</h2>
          <p className="text-muted-foreground text-sm">Готовые конфигурации от команды NOVA</p>
        </div>
        {!user ? (
          <Button variant="outline" onClick={onRequireAuth}>
            <Icon name="Lock" size={16} className="mr-2" />Войти для постов
          </Button>
        ) : canPost ? (
          <Button onClick={() => setOpen(!open)}>
            <Icon name="Plus" size={16} className="mr-2" />Новый пост
          </Button>
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

      {posts.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Пока нет ни одной сборки</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {posts.map((p) => (
            <Card key={p.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="aspect-video overflow-hidden bg-secondary">
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
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
      )}
    </div>
  );
}

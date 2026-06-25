import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { api, type User, type Post } from '@/lib/api';

interface PageFeedProps {
  posts: Post[];
  canPost: boolean;
  user: User | null;
  onAddPost: (p: Omit<Post, 'id' | 'author' | 'user_id'>) => void;
  onDeletePost: (id: number) => void;
  onBuy: () => void;
  onRequireAuth: () => void;
}

export default function PageFeed({ posts, canPost, user, onAddPost, onDeletePost, onBuy, onRequireAuth }: PageFeedProps) {
  const [form, setForm] = useState({ title: '', description: '', price: '', link: '', image: '' });
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!form.title || !form.price) { toast.error('Заполните название и цену'); return; }
    onAddPost(form);
    setForm({ title: '', description: '', price: '', link: '', image: '' });
    setOpen(false);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Выберите изображение'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл больше 5 МБ'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const res = await api.uploadImage(reader.result as string);
        setForm((f) => ({ ...f, image: res.url }));
        toast.success('Фото загружено');
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {form.image ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={form.image} alt="preview" className="w-full h-40 object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setForm({ ...form, image: '' })}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Icon name={uploading ? 'Loader' : 'Upload'} size={16} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
              {uploading ? 'Загрузка...' : 'Загрузить фото с устройства'}
            </Button>
          )}

          <Button onClick={submit} className="w-full" disabled={uploading}>Опубликовать</Button>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Пока нет ни одной сборки</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {posts.map((p) => {
            const isOwner = !!user && p.user_id === user.uid;
            return (
              <Card key={p.id} className="overflow-hidden group hover:border-primary/50 transition-colors relative">
                {isOwner && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-3 right-3 z-10 h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                )}
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
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пост?</AlertDialogTitle>
            <AlertDialogDescription>
              Сборка будет удалена из ленты безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId !== null) onDeletePost(deleteId);
                setDeleteId(null);
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { type Review } from '@/lib/api';

interface PageReviewsProps {
  reviews: Review[];
  onAdd: (text: string, rating: number) => void;
}

export default function PageReviews({ reviews, onAdd }: PageReviewsProps) {
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
        <Button onClick={() => {
          if (!text) { toast.error('Напишите текст'); return; }
          onAdd(text, rating);
          setText('');
        }}>
          Отправить
        </Button>
      </Card>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">Отзывов пока нет — будьте первым!</Card>
        ) : reviews.map((r) => (
          <Card key={r.id} className="p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {r.author[0]}
                </div>
                <span className="font-medium">{r.author}</span>
              </div>
              <div className="flex">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Icon key={i} name="Star" size={14} className="text-primary fill-primary" />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

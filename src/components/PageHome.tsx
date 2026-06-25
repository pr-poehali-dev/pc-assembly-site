import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface PageHomeProps {
  onBuy: () => void;
}

export default function PageHome({ onBuy }: PageHomeProps) {
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

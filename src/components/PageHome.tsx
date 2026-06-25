import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface PageHomeProps {
  onBuy: () => void;
}

export default function PageHome({ onBuy }: PageHomeProps) {
  return (
    <div className="animate-fade-in">
      <div className="relative flex flex-col items-center text-center py-20 md:py-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-primary/15 blur-[120px] rounded-full animate-glow pointer-events-none" />

        <Badge className="bg-accent text-accent-foreground border-0 mb-8">// сборка ПК на заказ</Badge>

        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.95] tracking-tight max-w-5xl">
          Собираем <span className="text-primary text-glow">ПК мечты</span> под твои задачи
        </h1>

        <p className="text-muted-foreground text-lg md:text-2xl max-w-2xl mt-8">
          Игры, работа, стримы. Подбираем комплектующие, собираем, тестируем и доставляем готовый компьютер.
        </p>

        <div className="flex gap-3 mt-10">
          <Button size="lg" onClick={onBuy} className="glow-cyan text-base h-12 px-8">
            <Icon name="ShoppingCart" size={20} className="mr-2" /> Купить ПК
          </Button>
        </div>

        <div className="flex gap-12 mt-16">
          {[['500+', 'сборок'], ['4.9', 'рейтинг'], ['2 года', 'гарантия']].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">{v}</div>
              <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

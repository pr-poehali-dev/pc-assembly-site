import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface PageSettingsProps {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

export default function PageSettings({ theme, setTheme }: PageSettingsProps) {
  const [notify, setNotify] = useState(true);
  const [news, setNews] = useState(false);

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <h2 className="font-display text-3xl font-bold">Настройки</h2>

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2">
              <Icon name={theme === 'dark' ? 'Moon' : 'Sun'} size={18} />Тема оформления
            </div>
            <div className="text-sm text-muted-foreground">{theme === 'dark' ? 'Тёмная' : 'Светлая'} тема</div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2">
              <Icon name="Bell" size={18} />Уведомления о заказе
            </div>
            <div className="text-sm text-muted-foreground">Статусы сборки вашего ПК</div>
          </div>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2">
              <Icon name="Mail" size={18} />Новости и акции
            </div>
            <div className="text-sm text-muted-foreground">Скидки на сборки и комплектующие</div>
          </div>
          <Switch checked={news} onCheckedChange={setNews} />
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="font-medium flex items-center gap-2">
          <Icon name="Sparkles" size={18} className="text-primary" />Бонус от NOVA
        </div>
        <p className="text-sm text-muted-foreground">
          Реферальная программа: приглашайте друзей и получайте скидку 5% на следующую сборку за каждого.
        </p>
        <Button variant="outline" size="sm" onClick={() => toast.success('Ссылка скопирована')}>
          <Icon name="Copy" size={14} className="mr-2" />Скопировать реф-ссылку
        </Button>
      </Card>
    </div>
  );
}

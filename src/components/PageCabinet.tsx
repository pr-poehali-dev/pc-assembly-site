import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { type User } from '@/lib/api';

interface PageCabinetProps {
  user: User;
  onSave: (name: string, email: string) => void;
  onLogout: () => void;
}

export default function PageCabinet({ user, onSave, onLogout }: PageCabinetProps) {
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
          <Button onClick={() => onSave(name, email)} className="w-full">Сохранить изменения</Button>
        </div>
      </Card>

      <Button variant="outline" onClick={onLogout} className="text-destructive">
        <Icon name="LogOut" size={16} className="mr-2" />Выйти из аккаунта
      </Button>
    </div>
  );
}

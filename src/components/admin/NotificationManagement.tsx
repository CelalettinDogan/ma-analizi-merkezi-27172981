import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Send,
  Users,
  Crown,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Notification {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  sentAt: string | null;
  deliveredCount: number;
  openedCount: number;
}

interface NotificationManagementProps {
  notifications: Notification[];
  tokenCount: number;
  isLoading: boolean;
  onSendNotification: (data: { title: string; body: string; targetAudience: string }) => Promise<void>;
  onRefresh: () => void;
}

const NotificationManagement: React.FC<NotificationManagementProps> = ({
  notifications,
  tokenCount,
  isLoading,
  onSendNotification,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Başlık ve mesaj gerekli');
      return;
    }

    setIsSending(true);
    try {
      await onSendNotification({ title, body, targetAudience });
      toast.success('Bildirim gönderildi');
      setTitle('');
      setBody('');
    } catch (e) {
      toast.error('Bildirim gönderilemedi');
    } finally {
      setIsSending(false);
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Badge variant="secondary">Tümü</Badge>;
      case 'premium':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Premium</Badge>;
      case 'free':
        return <Badge variant="outline">Free</Badge>;
      default:
        return <Badge variant="secondary">{audience}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h2 className="text-2xl font-bold">Push Bildirim Yönetimi</h2>
        <p className="text-muted-foreground">
          Kullanıcılara bildirim gönder ve geçmişi takip et
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tokenCount}</p>
                <p className="text-sm text-muted-foreground">Kayıtlı Cihaz</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Gönderilen Bildirim</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + n.openedCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Toplam Açılma</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Bildirim Gönder</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Yeni Bildirim
                </CardTitle>
                <CardDescription>
                  Seçili hedef kitleye anlık bildirim gönder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Başlık</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bildirim başlığı"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">{title.length}/50</p>
                </div>

                <div className="space-y-2">
                  <Label>Mesaj</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Bildirim mesajı"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{body.length}/200</p>
                </div>

                <div className="space-y-3">
                  <Label>Hedef Kitle</Label>
                  <RadioGroup value={targetAudience} onValueChange={setTargetAudience}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                        <Users className="w-4 h-4" />
                        Tüm Kullanıcılar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="premium" id="premium" />
                      <Label htmlFor="premium" className="flex items-center gap-2 cursor-pointer">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Sadece Premium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="free" id="free" />
                      <Label htmlFor="free" className="flex items-center gap-2 cursor-pointer">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Sadece Free
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleSend} 
                  disabled={isSending || !title.trim() || !body.trim()}
                  className="w-full gap-2"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gönder
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Bildirim Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Hedef</TableHead>
                        <TableHead className="text-center">Teslim</TableHead>
                        <TableHead className="text-center">Açılma</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {notification.body}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getAudienceBadge(notification.targetAudience)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{notification.deliveredCount}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{notification.openedCount}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(notification.sentAt)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {notifications.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Henüz bildirim gönderilmedi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default NotificationManagement;

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  User,
  Crown,
  Bell,
  Bot,
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface LogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, any> | null;
  createdAt: string;
}

interface ActivityLogProps {
  logs: LogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  isLoading,
  onRefresh,
}) => {
  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="w-4 h-4" />;
    if (action.includes('premium') || action.includes('subscription')) return <Crown className="w-4 h-4" />;
    if (action.includes('notification')) return <Bell className="w-4 h-4" />;
    if (action.includes('prompt') || action.includes('ai')) return <Bot className="w-4 h-4" />;
    if (action.includes('match')) return <Calendar className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban')) return 'text-red-500 bg-red-500/10';
    if (action.includes('create') || action.includes('assign')) return 'text-green-500 bg-green-500/10';
    if (action.includes('update') || action.includes('edit')) return 'text-blue-500 bg-blue-500/10';
    return 'text-primary bg-primary/10';
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'assign_premium': 'Premium Atadı',
      'remove_premium': 'Premium Kaldırdı',
      'ban_user': 'Kullanıcı Askıya Aldı',
      'unban_user': 'Askıyı Kaldırdı',
      'add_role': 'Rol Ekledi',
      'remove_role': 'Rol Kaldırdı',
      'update_prompt': 'Prompt Güncelledi',
      'send_notification': 'Bildirim Gönderdi',
      'tag_match': 'Maç Etiketledi',
    };
    return actionMap[action] || action;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
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
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Aktivite Logu</h2>
          <p className="text-muted-foreground">
            Admin işlemlerinin geçmişi
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </Button>
      </motion.div>

      {/* Log List */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{formatAction(log.action)}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.adminEmail || log.adminId.slice(0, 8)}
                        </p>
                        {log.targetType && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {log.targetType}
                            </Badge>
                            {log.targetId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.targetId.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        )}
                        {log.details && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    Henüz aktivite kaydı bulunmuyor
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ActivityLog;

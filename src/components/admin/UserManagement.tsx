import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Crown, 
  Shield, 
  Ban,
  UserCheck,
  Mail,
  Calendar,
  MessageSquare,
  BarChart3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignIn: string | null;
  isPremium: boolean;
  planType: string | null;
  roles: string[];
  chatUsageToday: number;
  analysisUsageToday: number;
  isBanned: boolean;
}

interface UserManagementProps {
  users: User[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onAssignPremium: (userId: string, planType: string, duration: number) => Promise<void>;
  onToggleRole: (userId: string, role: string, action: 'add' | 'remove') => Promise<void>;
  onBanUser: (userId: string, reason: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onRefresh,
  onAssignPremium,
  onToggleRole,
  onBanUser,
  onUnbanUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState('basic');
  const [premiumDuration, setPremiumDuration] = useState(30);
  const [banReason, setBanReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignPremium = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await onAssignPremium(selectedUser.id, premiumPlan, premiumDuration);
      toast.success('Premium atandı');
      setPremiumDialogOpen(false);
    } catch (e) {
      toast.error('Premium atanamadı');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setIsProcessing(true);
    try {
      await onBanUser(selectedUser.id, banReason);
      toast.success('Kullanıcı askıya alındı');
      setBanDialogOpen(false);
      setBanReason('');
    } catch (e) {
      toast.error('İşlem başarısız');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) {
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Admin</Badge>;
    }
    if (roles.includes('moderator')) {
      return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Moderator</Badge>;
    }
    if (roles.includes('vip')) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">VIP</Badge>;
    }
    return null;
  };

  const getPlanBadge = (isPremium: boolean, planType: string | null) => {
    if (!isPremium) {
      return <Badge variant="secondary">Free</Badge>;
    }
    const planColors: Record<string, string> = {
      basic: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      plus: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      pro: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    };
    return (
      <Badge className={planColors[planType || 'basic'] || planColors.basic}>
        {planType?.toUpperCase() || 'BASIC'}
      </Badge>
    );
  };

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
          <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
          <p className="text-muted-foreground">
            Toplam {totalCount.toLocaleString('tr-TR')} kullanıcı
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </Button>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Email veya isim ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtrele
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Table */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-center">Chat</TableHead>
                        <TableHead className="text-center">Analiz</TableHead>
                        <TableHead>Kayıt</TableHead>
                        <TableHead>Son Giriş</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className={user.isBanned ? 'opacity-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium truncate max-w-[150px]">
                                  {user.displayName || 'İsimsiz'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {user.email}
                                </p>
                              </div>
                              {user.isBanned && (
                                <Badge variant="destructive" className="text-xs">
                                  Askıda
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(user.isPremium, user.planType)}</TableCell>
                          <TableCell>{getRoleBadge(user.roles)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{user.chatUsageToday}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{user.analysisUsageToday}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.lastSignIn)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setPremiumDialogOpen(true);
                                  }}
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  Premium Ata
                                </DropdownMenuItem>
                                {!user.roles.includes('vip') ? (
                                  <DropdownMenuItem
                                    onClick={() => onToggleRole(user.id, 'vip', 'add')}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    VIP Yap
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => onToggleRole(user.id, 'vip', 'remove')}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    VIP Kaldır
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {!user.isBanned ? (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setBanDialogOpen(true);
                                    }}
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Askıya Al
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => onUnbanUser(user.id)}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Askıyı Kaldır
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Sayfa {page} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium Assignment Dialog */}
      <Dialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium Atama</DialogTitle>
            <DialogDescription>
              {selectedUser?.email} kullanıcısına premium paketi ata
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paket Tipi</Label>
              <Select value={premiumPlan} onValueChange={setPremiumPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Süre</Label>
              <Select 
                value={premiumDuration.toString()} 
                onValueChange={(v) => setPremiumDuration(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">1 Ay</SelectItem>
                  <SelectItem value="90">3 Ay</SelectItem>
                  <SelectItem value="180">6 Ay</SelectItem>
                  <SelectItem value="365">1 Yıl</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPremiumDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAssignPremium} disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Askıya Al</DialogTitle>
            <DialogDescription>
              {selectedUser?.email} kullanıcısını askıya alıyorsunuz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Askıya Alma Sebebi</Label>
              <Textarea
                placeholder="Sebebi yazın..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBanUser} 
              disabled={isProcessing || !banReason.trim()}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Askıya Al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UserManagement;

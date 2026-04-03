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
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
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
import { useIsMobile } from '@/hooks/use-mobile';

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

// --- Helper functions ---

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
    premium_basic: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    premium_plus: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    premium_pro: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    basic: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    plus: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    pro: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  };
  const displayName = planType?.replace('premium_', '').toUpperCase() || 'BASIC';
  return (
    <Badge className={planColors[planType || 'basic'] || planColors.basic}>
      {displayName}
    </Badge>
  );
};

// --- Mobile User Card ---

const MobileUserCard: React.FC<{
  user: User;
  onPremiumClick: (user: User) => void;
  onToggleRole: (userId: string, role: string, action: 'add' | 'remove') => Promise<void>;
  onBanClick: (user: User) => void;
  onUnbanUser: (userId: string) => Promise<void>;
}> = ({ user, onPremiumClick, onToggleRole, onBanClick, onUnbanUser }) => (
  <Card className={`${user.isBanned ? 'opacity-50' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold">
            {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate text-sm">{user.displayName || 'İsimsiz'}</p>
              {user.isBanned && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Askıda</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" aria-label="Kullanıcı işlemleri">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPremiumClick(user)}>
              <Crown className="w-4 h-4 mr-2" />Premium Ata
            </DropdownMenuItem>
            {!user.roles.includes('vip') ? (
              <DropdownMenuItem onClick={() => onToggleRole(user.id, 'vip', 'add')}>
                <Shield className="w-4 h-4 mr-2" />VIP Yap
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onToggleRole(user.id, 'vip', 'remove')}>
                <Shield className="w-4 h-4 mr-2" />VIP Kaldır
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {!user.isBanned ? (
              <DropdownMenuItem className="text-destructive" onClick={() => onBanClick(user)}>
                <Ban className="w-4 h-4 mr-2" />Askıya Al
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onUnbanUser(user.id)}>
                <UserCheck className="w-4 h-4 mr-2" />Askıyı Kaldır
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {getPlanBadge(user.isPremium, user.planType)}
        {getRoleBadge(user.roles)}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat: {user.chatUsageToday}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analiz: {user.analysisUsageToday}</span>
        </div>
        <div>Kayıt: {formatDate(user.createdAt)}</div>
        <div>Giriş: {formatDate(user.lastSignIn)}</div>
      </div>
    </CardContent>
  </Card>
);

// --- Premium Form Content ---

const PremiumFormContent: React.FC<{
  premiumPlan: string;
  setPremiumPlan: (v: string) => void;
  premiumDuration: number;
  setPremiumDuration: (v: number) => void;
}> = ({ premiumPlan, setPremiumPlan, premiumDuration, setPremiumDuration }) => (
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <Label>Paket Tipi</Label>
      <Select value={premiumPlan} onValueChange={setPremiumPlan}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="basic">Basic</SelectItem>
          <SelectItem value="plus">Plus</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Süre</Label>
      <Select value={premiumDuration.toString()} onValueChange={(v) => setPremiumDuration(Number(v))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="30">1 Ay</SelectItem>
          <SelectItem value="90">3 Ay</SelectItem>
          <SelectItem value="180">6 Ay</SelectItem>
          <SelectItem value="365">1 Yıl</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

// --- Ban Form Content ---

const BanFormContent: React.FC<{
  banReason: string;
  setBanReason: (v: string) => void;
}> = ({ banReason, setBanReason }) => (
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <Label>Askıya Alma Sebebi</Label>
      <Textarea placeholder="Sebebi yazın..." value={banReason} onChange={(e) => setBanReason(e.target.value)} />
    </div>
  </div>
);

// --- Main Component ---

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
  const isMobile = useIsMobile();
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
    } catch {
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
    } catch {
      toast.error('İşlem başarısız');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPremiumDialog = (user: User) => {
    setSelectedUser(user);
    setPremiumDialogOpen(true);
  };

  const openBanDialog = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  // --- Premium Dialog/Drawer ---
  const renderPremiumModal = () => {
    const title = "Premium Atama";
    const description = `${selectedUser?.email} kullanıcısına premium paketi ata`;
    const footer = (
      <>
        <Button variant="outline" onClick={() => setPremiumDialogOpen(false)}>İptal</Button>
        <Button onClick={handleAssignPremium} disabled={isProcessing}>
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Ata
        </Button>
      </>
    );

    if (isMobile) {
      return (
        <Drawer open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <PremiumFormContent premiumPlan={premiumPlan} setPremiumPlan={setPremiumPlan} premiumDuration={premiumDuration} setPremiumDuration={setPremiumDuration} />
            </div>
            <DrawerFooter className="flex-row gap-2">{footer}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <PremiumFormContent premiumPlan={premiumPlan} setPremiumPlan={setPremiumPlan} premiumDuration={premiumDuration} setPremiumDuration={setPremiumDuration} />
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // --- Ban Dialog/Drawer ---
  const renderBanModal = () => {
    const title = "Kullanıcıyı Askıya Al";
    const description = `${selectedUser?.email} kullanıcısını askıya alıyorsunuz`;
    const footer = (
      <>
        <Button variant="outline" onClick={() => setBanDialogOpen(false)}>İptal</Button>
        <Button variant="destructive" onClick={handleBanUser} disabled={isProcessing || !banReason.trim()}>
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Askıya Al
        </Button>
      </>
    );

    if (isMobile) {
      return (
        <Drawer open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <BanFormContent banReason={banReason} setBanReason={setBanReason} />
            </div>
            <DrawerFooter className="flex-row gap-2">{footer}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <BanFormContent banReason={banReason} setBanReason={setBanReason} />
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
          <p className="text-muted-foreground">Toplam {totalCount.toLocaleString('tr-TR')} kullanıcı</p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="gap-2" aria-label="Kullanıcı listesini yenile">
          <RefreshCw className="w-4 h-4" />Yenile
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Email veya isim ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Kullanıcı ara"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* User List */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {isMobile ? (
                  /* Mobile: Card list */
                  <div className="p-3 space-y-3">
                    {filteredUsers.map((user) => (
                      <MobileUserCard
                        key={user.id}
                        user={user}
                        onPremiumClick={openPremiumDialog}
                        onToggleRole={onToggleRole}
                        onBanClick={openBanDialog}
                        onUnbanUser={onUnbanUser}
                      />
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">Kullanıcı bulunamadı</p>
                    )}
                  </div>
                ) : (
                  /* Desktop: Table */
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
                                  <p className="font-medium truncate max-w-[150px]">{user.displayName || 'İsimsiz'}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                                </div>
                                {user.isBanned && <Badge variant="destructive" className="text-xs">Askıda</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>{getPlanBadge(user.isPremium, user.planType)}</TableCell>
                            <TableCell>{getRoleBadge(user.roles)}</TableCell>
                            <TableCell className="text-center"><Badge variant="outline">{user.chatUsageToday}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="outline">{user.analysisUsageToday}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(user.lastSignIn)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Kullanıcı işlemleri">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openPremiumDialog(user)}>
                                    <Crown className="w-4 h-4 mr-2" />Premium Ata
                                  </DropdownMenuItem>
                                  {!user.roles.includes('vip') ? (
                                    <DropdownMenuItem onClick={() => onToggleRole(user.id, 'vip', 'add')}>
                                      <Shield className="w-4 h-4 mr-2" />VIP Yap
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => onToggleRole(user.id, 'vip', 'remove')}>
                                      <Shield className="w-4 h-4 mr-2" />VIP Kaldır
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {!user.isBanned ? (
                                    <DropdownMenuItem className="text-destructive" onClick={() => openBanDialog(user)}>
                                      <Ban className="w-4 h-4 mr-2" />Askıya Al
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => onUnbanUser(user.id)}>
                                      <UserCheck className="w-4 h-4 mr-2" />Askıyı Kaldır
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
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Sayfa {page} / {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Önceki sayfa">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Sonraki sayfa">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {renderPremiumModal()}
      {renderBanModal()}
    </motion.div>
  );
};

export default UserManagement;

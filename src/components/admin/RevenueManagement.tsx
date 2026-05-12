import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRevenueStats } from '@/hooks/admin/useRevenueStats';
import { staggerContainer, staggerItem } from '@/lib/animations';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

const PLAN_COLORS: Record<string, string> = {
  premium_basic: 'hsl(217 91% 60%)',
  premium_plus: 'hsl(280 80% 65%)',
  premium_pro: 'hsl(43 96% 56%)',
};

const planLabel = (p: string) =>
  p.replace('premium_', '').replace(/^./, (c) => c.toUpperCase());

const RevenueManagement: React.FC = () => {
  const { kpis, breakdown, flow, recent, isLoading, refetch } = useRevenueStats();

  if (isLoading || !kpis) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'MRR',
      value: fmtCurrency(kpis.mrr),
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      hint: `${kpis.activeSubs} aktif abone`,
    },
    {
      label: 'ARPU',
      value: fmtCurrency(kpis.arpu),
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      hint: 'Abone başı aylık',
    },
    {
      label: 'Aktif Abone',
      value: kpis.activeSubs.toLocaleString('tr-TR'),
      icon: Users,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      hint: `+${kpis.newSubs30d} son 30g`,
    },
    {
      label: 'Churn (30g)',
      value: `%${kpis.churn30d.toFixed(1)}`,
      icon: AlertCircle,
      color: kpis.churn30d > 10 ? 'text-red-500' : 'text-amber-500',
      bg: kpis.churn30d > 10 ? 'bg-red-500/10' : 'bg-amber-500/10',
      hint: `${kpis.cancelled30d} iptal`,
    },
    {
      label: 'Trial',
      value: kpis.trialSubs.toLocaleString('tr-TR'),
      icon: Sparkles,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      hint: 'Streak ödülü dahil',
    },
  ];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Gelir & Abonelik
          </h2>
          <p className="text-muted-foreground text-sm">
            MRR, churn ve plan bazlı performans
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="pt-5">
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${k.color}`} />
                </div>
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{k.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan dağılımı */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aktif abone yok</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="count"
                      nameKey="planType"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {breakdown.map((b) => (
                        <Cell key={b.planType} fill={PLAN_COLORS[b.planType] || 'hsl(var(--primary))'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any, _n, p: any) => [`${v} abone`, planLabel(p.payload.planType)]}
                    />
                    <Legend
                      formatter={(v) => planLabel(v as string)}
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MRR by plan */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Bazlı MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="planType"
                    tickFormatter={(v) => planLabel(v as string)}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [fmtCurrency(Number(v)), 'MRR']}
                    labelFormatter={(l) => planLabel(l as string)}
                  />
                  <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                    {breakdown.map((b) => (
                      <Cell key={b.planType} fill={PLAN_COLORS[b.planType] || 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription flow */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">30 Günlük Abonelik Akışı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flow} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(l) => fmtDate(l as string)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  <Bar dataKey="new" name="Yeni" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="İptal" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent transactions */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Son İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead>Bitiş</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Otomatik Yenile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        Kayıt yok
                      </TableCell>
                    </TableRow>
                  )}
                  {recent.map((r) => {
                    const isActive =
                      r.is_active && new Date(r.expires_at).getTime() > Date.now();
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {planLabel(r.plan_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.platform || '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {fmtDate(r.starts_at)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {fmtDate(r.expires_at)}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Sona ermiş</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.auto_renewing ? '✓' : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default RevenueManagement;

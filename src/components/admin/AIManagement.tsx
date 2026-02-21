import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Target, 
  MessageSquare,
  Save,
  Loader2,
  RefreshCw,
  BarChart3,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { LEAGUE_NAMES } from '@/constants/predictions';
import type { LeagueStats } from '@/hooks/admin/useAdminData';

interface PredictionStats {
  type: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface AIManagementProps {
  predictionStats: PredictionStats[];
  leagueStats: LeagueStats[];
  overallAccuracy: number;
  totalPredictions: number;
  systemPrompt: string;
  isLoading: boolean;
  onSavePrompt: (prompt: string) => Promise<void>;
  onRefresh: () => void;
}

const getLeagueDisplayName = (code: string): string => {
  return LEAGUE_NAMES[code] || code;
};

const AIManagement: React.FC<AIManagementProps> = ({
  predictionStats,
  leagueStats,
  overallAccuracy,
  totalPredictions,
  systemPrompt: initialPrompt,
  isLoading,
  onSavePrompt,
  onRefresh,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      await onSavePrompt(prompt);
      toast.success('Sistem promptu güncellendi');
    } catch (e) {
      toast.error('Prompt kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-500';
    if (accuracy >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 70) return <Badge className="bg-green-500/20 text-green-500">İyi</Badge>;
    if (accuracy >= 50) return <Badge className="bg-yellow-500/20 text-yellow-500">Orta</Badge>;
    return <Badge className="bg-red-500/20 text-red-500">Düşük</Badge>;
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
          <h2 className="text-2xl font-bold">AI & Analiz Kontrolü</h2>
          <p className="text-muted-foreground">
            Tahmin istatistikleri ve sistem promptu yönetimi
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
                  %{overallAccuracy.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Genel Başarı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPredictions.toLocaleString('tr-TR')}</p>
                <p className="text-sm text-muted-foreground">Toplam Tahmin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{predictionStats.length}</p>
                <p className="text-sm text-muted-foreground">Tahmin Kategorisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="leagues">Lig Bazlı</TabsTrigger>
          <TabsTrigger value="prompt">Sistem Promptu</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle>Tahmin Kategorileri</CardTitle>
                <CardDescription>Her kategori için başarı oranları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictionStats.map((stat) => (
                  <div key={stat.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stat.type}</span>
                        {getAccuracyBadge(stat.accuracy)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {stat.correct}/{stat.total}
                        </span>
                        <span className={`font-bold ${getAccuracyColor(stat.accuracy)}`}>
                          %{stat.accuracy.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <Progress value={stat.accuracy} className="h-2" />
                  </div>
                ))}

                {predictionStats.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz doğrulanmış tahmin bulunmuyor
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="leagues" className="space-y-4">
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Lig Bazlı Başarı
                </CardTitle>
                <CardDescription>Hangi liglerde daha başarılı tahminler yapılıyor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {leagueStats.map((stat) => (
                  <div key={stat.league} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getLeagueDisplayName(stat.league)}</span>
                        {getAccuracyBadge(stat.accuracy)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {stat.correct}/{stat.total}
                        </span>
                        <span className={`font-bold ${getAccuracyColor(stat.accuracy)}`}>
                          %{stat.accuracy.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <Progress value={stat.accuracy} className="h-2" />
                  </div>
                ))}

                {leagueStats.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz lig bazlı veri bulunmuyor
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Sistem Promptu
                </CardTitle>
                <CardDescription>
                  AI chatbot'un davranışını belirleyen temel talimatlar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sistem Promptu</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="AI sistem talimatlarını buraya yazın..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {prompt.length} karakter
                  </p>
                  <Button onClick={handleSavePrompt} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AIManagement;
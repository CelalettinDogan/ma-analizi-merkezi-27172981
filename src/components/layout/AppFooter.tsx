import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, BarChart3, Twitter, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AppFooter: React.FC = () => {
  const [stats, setStats] = useState({
    totalAnalysis: 0,
    accuracy: 0,
    premiumAccuracy: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [totalResult, accuracyResult, premiumResult] = await Promise.all([
          supabase.from('predictions').select('*', { count: 'exact', head: true }),
          supabase.from('overall_stats').select('accuracy_percentage').single(),
          supabase.from('ml_model_stats').select('premium_accuracy').limit(1).maybeSingle(),
        ]);

        setStats({
          totalAnalysis: totalResult.count || 0,
          accuracy: Math.round(accuracyResult.data?.accuracy_percentage || 0),
          premiumAccuracy: Math.round(premiumResult.data?.premium_accuracy || 0),
        });
      } catch (e) {
        console.error('Error fetching footer stats:', e);
      }
    };

    fetchStats();
  }, []);

  return (
    <footer className="hidden md:block py-12 border-t border-border/50 bg-gradient-to-t from-background to-transparent">
      <div className="container mx-auto px-4">
        {/* Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-8 mb-10 pb-10 border-b border-border/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{stats.totalAnalysis.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Toplam Analiz</div>
            </div>
          </div>

          <div className="w-px h-8 bg-border/50" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold gradient-text">%{stats.accuracy}</div>
              <div className="text-xs text-muted-foreground">Genel Doğruluk</div>
            </div>
          </div>

          <div className="w-px h-8 bg-border/50" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="text-xl font-bold gradient-text-gold">%{stats.premiumAccuracy}</div>
              <div className="text-xs text-muted-foreground">Premium Doğruluk</div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold">FT</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">FutbolTahmin</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              AI destekli futbol analiz platformu. Veri odaklı istatistikler, 
              makine öğrenimi tahminleri ve kapsamlı maç analizleri.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-muted-foreground" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
              <a 
                href="mailto:info@futboltahmin.com" 
                className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Hızlı Erişim</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link to="/live" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Canlı Maçlar
                </Link>
              </li>
              <li>
                <Link to="/standings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Lig Sıralamaları
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Yasal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Gizlilik Politikası
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Kullanım Şartları
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sorumlu Bahis
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            © {new Date().getFullYear()} FutbolTahmin. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">
            Bu site yalnızca bilgilendirme amaçlıdır. 18 yaş altı kullanıcılara yönelik değildir. 
            Bahis oynamadan önce lütfen yerel yasaları kontrol edin.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;

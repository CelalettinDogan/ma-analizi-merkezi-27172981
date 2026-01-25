import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const AppFooter: React.FC = () => {
  return (
    <footer className="hidden md:block py-12 border-t border-border/50 bg-gradient-to-t from-background to-transparent">
      <div className="container mx-auto px-4">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold">GM</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">Gol Metrik</span>
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
                href="mailto:info@golmetrik.com" 
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
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Profil
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Yasal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            © {new Date().getFullYear()} Gol Metrik. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">
            Tüm içerikler bilgilendirme amaçlıdır ve tavsiye niteliği taşımaz.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;

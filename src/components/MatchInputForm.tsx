import React, { useState } from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MatchInput } from '@/types/match';

interface MatchInputFormProps {
  onSubmit: (data: MatchInput) => void;
}

const MatchInputForm: React.FC<MatchInputFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<MatchInput>({
    league: '',
    homeTeam: '',
    awayTeam: '',
    matchDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof MatchInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Maç Bilgilerini Girin
        </h2>
        <p className="text-muted-foreground">
          Analiz için gerekli bilgileri doldurun
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="league" className="flex items-center gap-2 text-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            Lig
          </Label>
          <Input
            id="league"
            placeholder="Örn: Süper Lig"
            value={formData.league}
            onChange={(e) => handleChange('league', e.target.value)}
            className="bg-muted/50 border-border focus:border-primary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="matchDate" className="flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            Maç Tarihi
          </Label>
          <Input
            id="matchDate"
            type="date"
            value={formData.matchDate}
            onChange={(e) => handleChange('matchDate', e.target.value)}
            className="bg-muted/50 border-border focus:border-primary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="homeTeam" className="flex items-center gap-2 text-foreground">
            <Users className="w-4 h-4 text-primary" />
            Ev Sahibi Takım
          </Label>
          <Input
            id="homeTeam"
            placeholder="Örn: Galatasaray"
            value={formData.homeTeam}
            onChange={(e) => handleChange('homeTeam', e.target.value)}
            className="bg-muted/50 border-border focus:border-primary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="awayTeam" className="flex items-center gap-2 text-foreground">
            <Users className="w-4 h-4 text-secondary" />
            Deplasman Takımı
          </Label>
          <Input
            id="awayTeam"
            placeholder="Örn: Fenerbahçe"
            value={formData.awayTeam}
            onChange={(e) => handleChange('awayTeam', e.target.value)}
            className="bg-muted/50 border-border focus:border-primary"
            required
          />
        </div>
      </div>

      <Button type="submit" variant="hero" size="xl" className="w-full mt-8">
        Analizi Başlat
      </Button>
    </form>
  );
};

export default MatchInputForm;

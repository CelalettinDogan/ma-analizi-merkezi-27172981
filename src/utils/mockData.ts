import { MatchAnalysis, MatchInput } from '@/types/match';

export const generateMockAnalysis = (input: MatchInput): MatchAnalysis => {
  return {
    input,
    homeTeamStats: {
      form: ['W', 'W', 'D', 'W', 'L'],
      homePerformance: { wins: 6, draws: 2, losses: 1 },
      goalsScored: 12,
      goalsConceded: 5,
    },
    awayTeamStats: {
      form: ['W', 'L', 'W', 'D', 'W'],
      awayPerformance: { wins: 4, draws: 3, losses: 2 },
      goalsScored: 9,
      goalsConceded: 7,
    },
    headToHead: {
      lastMatches: [
        { date: '2024-03-15', homeTeam: input.homeTeam, awayTeam: input.awayTeam, score: '2-1' },
        { date: '2023-11-20', homeTeam: input.awayTeam, awayTeam: input.homeTeam, score: '1-1' },
        { date: '2023-05-08', homeTeam: input.homeTeam, awayTeam: input.awayTeam, score: '3-0' },
        { date: '2022-12-12', homeTeam: input.awayTeam, awayTeam: input.homeTeam, score: '2-2' },
      ],
      homeWins: 5,
      awayWins: 3,
      draws: 4,
    },
    predictions: [
      {
        type: 'Maç Sonucu',
        prediction: `${input.homeTeam} Kazanır`,
        confidence: 'orta',
        reasoning: `${input.homeTeam} ev sahibi avantajı ve son dönemdeki güçlü formuyla öne çıkıyor. Ancak ${input.awayTeam}'nin deplasman performansı da göz ardı edilmemeli.`,
      },
      {
        type: 'Doğru Skor',
        prediction: '2-1',
        confidence: 'düşük',
        reasoning: 'Her iki takımın da gol atma kapasitesi yüksek. Ev sahibi avantajıyla 2-1 skorunun olasılığı değerlendirilmektedir.',
      },
      {
        type: 'Karşılıklı Gol',
        prediction: 'Evet',
        confidence: 'yüksek',
        reasoning: 'Her iki takımın da son maçlardaki gol ortalamaları ve savunma zaafiyetleri göz önüne alındığında, karşılıklı gol olma olasılığı yüksektir.',
      },
      {
        type: 'Toplam Gol Alt/Üst',
        prediction: '2.5 Üst',
        confidence: 'orta',
        reasoning: 'Takımların son 5 maçtaki gol ortalamaları ve karşılaşma geçmişi, yüksek skorlu bir maç işaret etmektedir.',
      },
      {
        type: 'İlk Yarı Sonucu',
        prediction: 'Beraberlik',
        confidence: 'orta',
        reasoning: 'Her iki takımın da temkinli başlama eğilimi ve ilk yarı istatistikleri dikkate alındığında beraberlik olasılığı değerlendirilmektedir.',
      },
    ],
    tacticalAnalysis: `${input.homeTeam} genellikle 4-3-3 formasyonu tercih ederken, ${input.awayTeam} 4-2-3-1 ile sahaya çıkıyor. Ev sahibi takımın kanat ataklarına karşı deplasman takımının orta saha hâkimiyeti önemli bir faktör olacak. Her iki teknik direktörün de son maçlardaki taktiksel değişiklikleri göz önüne alındığında, kontrollü ama hızlı geçişlere dayalı bir oyun beklenmektedir.`,
    keyFactors: [
      'Ev sahibi takımın son 5 iç saha maçında 4 galibiyet alması',
      'Deplasman takımının son 3 dış saha maçını kaybetmemesi',
      'İki takım arasındaki son 5 maçta karşılıklı gol olması',
      'Hakem istatistiklerine göre maç başına ortalama 4.2 sarı kart',
      'Maçın şampiyonluk yarışı açısından kritik önemi',
    ],
    injuries: {
      home: ['Oyuncu A (Sakatlık - 2 hafta)', 'Oyuncu B (Cezalı)'],
      away: ['Oyuncu X (Sakatlık - Belirsiz)'],
    },
  };
};

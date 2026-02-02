import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DeleteAccount: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { returnTo: '/delete-account' } });
    }
  }, [user, navigate]);

  const handleDelete = async () => {
    if (confirmText !== 'SİL') {
      toast({
        title: 'Onay gerekli',
        description: 'Lütfen "SİL" yazarak işlemi onaylayın.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Sign out and redirect
      await signOut();
      
      toast({
        title: 'Hesap silindi',
        description: 'Hesabınız ve tüm verileriniz başarıyla silindi.',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Hesap silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Hesabı Sil</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Warning Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Bu işlem geri alınamaz!</AlertTitle>
          <AlertDescription>
            Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecek ve 
            kurtarılamayacaktır.
          </AlertDescription>
        </Alert>

        {/* Data to be deleted */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Silinecek Veriler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hesabınızı sildiğinizde aşağıdaki veriler kalıcı olarak silinecektir:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Profil bilgileriniz (ad, e-posta)</li>
              <li>Tüm analiz geçmişiniz</li>
              <li>Chat geçmişiniz</li>
              <li>Favori takımlarınız</li>
              <li>Premium abonelik kayıtlarınız</li>
              <li>Tüm kullanım verileri</li>
            </ul>
            <p className="text-sm text-amber-500 font-medium mt-4">
              ⚠️ Premium aboneliğiniz varsa, önce Google Play Store'dan iptal etmenizi öneririz.
            </p>
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Onay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hesabınızı silmek istediğinizi onaylamak için aşağıdaki kutuya{' '}
              <span className="font-bold text-foreground">SİL</span> yazın.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder='SİL yazın'
              className="text-center font-bold"
              disabled={isDeleting}
            />
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== 'SİL' || isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hesabımı Kalıcı Olarak Sil
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isDeleting}
                className="w-full"
              >
                Vazgeç
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alternative contact */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Sorularınız için:{' '}
              <a 
                href="mailto:info@golmetrik.com" 
                className="text-primary hover:underline"
              >
                info@golmetrik.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeleteAccount;

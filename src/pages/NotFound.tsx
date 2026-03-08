import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background pt-safe px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6"
      >
        {/* Brand icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <span className="text-4xl font-extrabold text-primary">404</span>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Sayfa bulunamadı</h1>
          <p className="text-sm text-muted-foreground max-w-[260px] mx-auto">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <motion.div whileTap={{ scale: 0.97 }}>
          <Button 
            onClick={() => navigate('/', { replace: true })}
            className="rounded-2xl h-12 px-8 text-sm font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;

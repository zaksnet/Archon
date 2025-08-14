import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

interface CompletionStepProps {
  onComplete: () => void;
}

export const CompletionStep = ({ onComplete }: CompletionStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          All Set!
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          You're ready to start using Archon. Begin by adding knowledge sources through website crawling or document uploads.
        </p>
        
        <Button
          variant="primary"
          size="lg"
          onClick={onComplete}
          className="min-w-[200px]"
        >
          Start Using Archon
        </Button>
      </Card>
    </motion.div>
  );
};

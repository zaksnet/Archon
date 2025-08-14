import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Welcome to Archon
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Let's get you set up with your AI provider in just a few steps. This will enable intelligent knowledge retrieval and code assistance.
        </p>
        
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          className="min-w-[200px]"
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Card>
    </motion.div>
  );
};

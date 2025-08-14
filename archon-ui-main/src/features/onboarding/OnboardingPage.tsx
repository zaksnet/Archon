import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { WelcomeStep, ProviderStep, CompletionStep } from './components/steps';
import { OnboardingErrorBoundary } from './components/error-handling';
import { OnboardingValidator } from './utils/validation';

export const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // No validation needed on mount - the onboarding state is valid by default

  const handleProviderSaved = () => {
    try {
      setCurrentStep(3);
    } catch (error) {
      console.error('Error advancing to completion step:', error);
      setHasError(true);
      setErrorMessage('Failed to advance to next step');
    }
  };

  const handleProviderSkip = () => {
    try {
      // Navigate to settings with guidance
      navigate('/settings');
    } catch (error) {
      console.error('Error navigating to settings:', error);
      setHasError(true);
      setErrorMessage('Failed to navigate to settings');
    }
  };

  const handleComplete = () => {
    try {
      // Mark onboarding as dismissed and navigate to home
      localStorage.setItem('onboardingDismissed', 'true');
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setHasError(true);
      setErrorMessage('Failed to complete onboarding');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={() => setCurrentStep(2)} />;
      case 2:
        return (
          <motion.div variants={itemVariants}>
            <Card className="p-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mr-4">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Configure AI Provider
                </h2>
              </div>
              
              <ProviderStep
                onSaved={handleProviderSaved}
                onSkip={handleProviderSkip}
              />
            </Card>
          </motion.div>
        );
      case 3:
        return <CompletionStep onComplete={handleComplete} />;
      default:
        return <WelcomeStep onNext={() => setCurrentStep(2)} />;
    }
  };

  // Error state UI
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Onboarding Error
          </h1>
          
          <p className="text-gray-600 dark:text-zinc-400 mb-6">
            {errorMessage || 'An unexpected error occurred during onboarding.'}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </Card>
      </div>
    );
  }

  return (
    <OnboardingErrorBoundary>
      <div className="relative min-h-screen bg-white dark:bg-black overflow-hidden">
        {/* Fixed full-page background grid that doesn't scroll */}
        <div className="fixed inset-0 neon-grid pointer-events-none z-0"></div>
        
        {/* Main content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-2xl"
          >
            {/* Progress Indicators */}
            <motion.div variants={itemVariants} className="flex justify-center mb-8 gap-3">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-16 rounded-full transition-colors duration-300 ${
                    step <= currentStep
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-zinc-800'
                  }`}
                />
              ))}
            </motion.div>

            {/* Current Step */}
            {renderStep()}
          </motion.div>
        </div>
      </div>
    </OnboardingErrorBoundary>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-300 text-black flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-black mb-2">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
        The requested screen is not available in the Yelahanka showroom manager portal.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
        <Button
          variant="black"
          size="sm"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Home className="w-4 h-4" />}
        >
          Manager Dashboard
        </Button>
      </div>
    </div>
  );
};

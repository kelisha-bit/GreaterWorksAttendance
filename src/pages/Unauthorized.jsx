import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;

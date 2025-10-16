import React, { useState } from 'react';
import Button from './common/Button';
import Card from './common/Card';
import { GoogleIcon } from './icons';

interface LoginProps {
    onEmailLogin: (email: string, password: string) => Promise<void>;
    onGoogleLogin: () => Promise<void>;
    error: string | null;
}

const Login: React.FC<LoginProps> = ({ onEmailLogin, onGoogleLogin, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onEmailLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 bg-gw-gold rounded-full"></div>
                 <div>
                    <h1 className="text-3xl font-bold text-gw-dark">Greater Works City Church</h1>
                    <p className="text-lg text-gray-600">Attendance Tracker</p>
                 </div>
            </div>
            
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gw-dark mb-6">Admin & Leader Login</h2>
                
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder="e.g., admin@gwcc.com"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-gw-gold focus:border-gw-gold" 
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            placeholder="••••••••"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-gw-gold focus:border-gw-gold" 
                        />
                    </div>
                    <div>
                        <Button type="submit" className="w-full">Sign In</Button>
                    </div>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div>
                     <Button variant="secondary" onClick={onGoogleLogin} className="w-full" icon={<GoogleIcon />}>
                        Sign in with Google
                     </Button>
                </div>
                 <div className="mt-6 text-center text-xs text-gray-500">
                    <p>For demonstration purposes, you can use:</p>
                    <p><strong>admin@gwcc.com</strong> / password</p>
                    <p><strong>leader@gwcc.com</strong> / password</p>
                    <p><strong>viewer@gwcc.com</strong> / password</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;

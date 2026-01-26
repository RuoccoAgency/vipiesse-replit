import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Login() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    setLocation("/");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register(email, name);
    setLocation("/");
  };

  return (
    <div className="container mx-auto px-4 py-32 pt-32 flex flex-col justify-center items-center min-h-[80vh]">
      
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-4xl font-heading font-bold uppercase tracking-tighter text-gray-900">
          Account
        </h1>
        <p className="text-gray-500">Gestisci i tuoi ordini e i tuoi dati personali.</p>
      </div>

      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-full mb-8">
            <TabsTrigger 
              value="login" 
              className="rounded-full data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-500 font-heading uppercase tracking-widest text-xs h-10"
            >
              Accedi
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="rounded-full data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-500 font-heading uppercase tracking-widest text-xs h-10"
            >
              Registrati
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-[2rem]">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="mario@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wide text-gray-500 font-bold">Password</Label>
                    <span className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">Password dimenticata?</span>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                  />
                </div>
                
                <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base mt-2">
                  ACCEDI
                </Button>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-[2rem]">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Nome Completo</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Mario Rossi" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="mario@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    placeholder="••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                  />
                </div>
                
                <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base mt-2">
                  CREA ACCOUNT
                </Button>
                
                <p className="text-xs text-gray-500 text-center leading-relaxed px-4">
                  Cliccando su Crea Account accetti i nostri Termini di Servizio e la Privacy Policy.
                </p>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

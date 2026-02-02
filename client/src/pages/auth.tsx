import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export function Login() {
  const { login, register, isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      setLocation("/account");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await register(email, password, name, surname, phone || undefined);
    setIsLoading(false);
    if (success) {
      setLocation("/account");
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4 py-12 flex flex-col justify-center items-center">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-4xl font-heading font-bold uppercase tracking-tighter text-gray-900">
              Il tuo Account
            </h1>
            <p className="text-gray-500">Bentornato, {user.name}!</p>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nome:</span>
                  <span className="font-medium text-gray-900">{user.name} {user.surname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium text-gray-900">{user.email}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setLocation("/account/orders")}
              className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12"
            >
              I Miei Ordini
            </Button>

            <Button 
              onClick={logout}
              variant="outline"
              className="w-full h-12"
            >
              Esci
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 flex flex-col justify-center items-center">
        
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
              <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl">
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
                      disabled={isLoading}
                      className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      disabled={isLoading}
                      className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                      data-testid="input-login-password"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base mt-2"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Accesso...
                      </>
                    ) : (
                      "ACCEDI"
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Nome *</Label>
                      <Input 
                        id="reg-name" 
                        placeholder="Mario" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        disabled={isLoading}
                        className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                        data-testid="input-register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-surname" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Cognome *</Label>
                      <Input 
                        id="reg-surname" 
                        placeholder="Rossi" 
                        value={surname} 
                        onChange={e => setSurname(e.target.value)} 
                        required 
                        disabled={isLoading}
                        className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                        data-testid="input-register-surname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Email *</Label>
                    <Input 
                      id="reg-email" 
                      type="email" 
                      placeholder="mario@example.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      disabled={isLoading}
                      className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                      data-testid="input-register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Telefono</Label>
                    <Input 
                      id="reg-phone" 
                      type="tel" 
                      placeholder="+39 333 1234567" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      disabled={isLoading}
                      className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                      data-testid="input-register-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Password *</Label>
                    <Input 
                      id="reg-password" 
                      type="password" 
                      placeholder="Minimo 6 caratteri" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      minLength={6}
                      disabled={isLoading}
                      className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 focus:ring-0 transition-colors" 
                      data-testid="input-register-password"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base mt-2"
                    disabled={isLoading}
                    data-testid="button-register"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registrazione...
                      </>
                    ) : (
                      "CREA ACCOUNT"
                    )}
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
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-[70vh]">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2 bg-neutral-900">
          <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-black text-neutral-400">Accedi</TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-black text-neutral-400">Registrati</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Card className="bg-neutral-900 border-neutral-800 text-white">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Bentornato</CardTitle>
              <CardDescription className="text-neutral-400">Inserisci le tue credenziali per accedere.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="mario@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-black border-neutral-700 focus:border-white" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required className="bg-black border-neutral-700 focus:border-white" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 uppercase font-bold tracking-widest">Accedi</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="register">
          <Card className="bg-neutral-900 border-neutral-800 text-white">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Nuovo Account</CardTitle>
              <CardDescription className="text-neutral-400">Crea un account per gestire i tuoi ordini.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="reg-name">Nome</Label>
                  <Input id="reg-name" placeholder="Mario Rossi" value={name} onChange={e => setName(e.target.value)} required className="bg-black border-neutral-700 focus:border-white" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="mario@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-black border-neutral-700 focus:border-white" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required className="bg-black border-neutral-700 focus:border-white" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 uppercase font-bold tracking-widest">Registrati</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Switch, Route, Router as WouterRouter } from "wouter";
import { Layout } from "./components/layout";
import { Home } from "./pages/home";
import { Shop } from "./pages/shop";
import { Business } from "./pages/business";
import { Checkout } from "./pages/checkout";
import { Login } from "./pages/auth"; // Assuming I'll create this next
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/scroll-to-top"; // Helper to scroll top on route change

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Shop Routes */}
      <Route path="/shop">
         {() => <Shop />}
      </Route>
      <Route path="/shop/donna">
         {() => <Shop category="donna" />}
      </Route>
      <Route path="/shop/uomo">
         {() => <Shop category="uomo" />}
      </Route>
      <Route path="/shop/bambino">
         {() => <Shop category="bambino" />}
      </Route>

      {/* Outlet Routes */}
      <Route path="/outlet">
         {() => <Shop isOutlet={true} />}
      </Route>
      <Route path="/outlet/donna">
         {() => <Shop category="donna" isOutlet={true} />}
      </Route>
      <Route path="/outlet/uomo">
         {() => <Shop category="uomo" isOutlet={true} />}
      </Route>
      <Route path="/outlet/bambino">
         {() => <Shop category="bambino" isOutlet={true} />}
      </Route>

      <Route path="/business" component={Business} />
      <Route path="/login" component={Login} />
      <Route path="/checkout" component={Checkout} />

      {/* Help Routes - Generic for now */}
      <Route path="/help/:topic">
        {(params) => (
           <div className="container mx-auto py-20 px-4 text-center">
             <h1 className="text-3xl font-heading mb-4 capitalize">{params.topic.replace('-', ' ')}</h1>
             <p className="text-neutral-400">Pagina in costruzione. Contattaci per maggiori informazioni.</p>
           </div>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Router />
    </Layout>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { Layout } from "./components/layout";
import { Home } from "./pages/home";
import { Shop } from "./pages/shop";
import { Business } from "./pages/business";
import { Checkout } from "./pages/checkout";
import { Login } from "./pages/auth";
import { ContactPage, SizeGuidePage, TermsPage, PaymentsPage, ShippingPage } from "./pages/help-pages";
import NotFound from "./pages/not-found";
import { ProductDetail } from "./pages/product-detail";
import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/scroll-to-top";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:id" component={ProductDetail} />
      
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

      {/* Help Routes */}
      <Route path="/help/contattaci" component={ContactPage} />
      <Route path="/help/taglie" component={SizeGuidePage} />
      <Route path="/help/condizioni" component={TermsPage} />
      <Route path="/help/pagamenti" component={PaymentsPage} />
      <Route path="/help/spedizioni-resi" component={ShippingPage} />

      {/* Fallback for other help routes or 404 */}
      <Route path="/help/:topic">
        {(params) => (
           <div className="container mx-auto py-20 px-4 text-center">
             <h1 className="text-3xl font-heading mb-4 capitalize">{params.topic.replace('-', ' ')}</h1>
             <p className="text-neutral-400">Pagina in costruzione.</p>
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

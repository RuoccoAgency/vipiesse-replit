import { Switch, Route } from "wouter";
import { Layout } from "./components/layout";
import { Home } from "./pages/home";
import { Shop } from "./pages/shop";
import { Business } from "./pages/business";
import { Checkout } from "./pages/checkout";
import { OrderSuccess } from "./pages/order-success";
import { OrderBank } from "./pages/order-bank";
import { Login } from "./pages/auth";
import { MyOrders } from "./pages/my-orders";
import { Dashboard } from "./pages/dashboard";
import { SavedItems } from "./pages/saved-items";
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
      
      <Route path="/shop">
         {() => <Shop />}
      </Route>
      <Route path="/shop/:collection">
         {(params) => <Shop collection={params.collection} />}
      </Route>

      <Route path="/business" component={Business} />
      <Route path="/login" component={Login} />
      <Route path="/account" component={Dashboard} />
      <Route path="/account/orders" component={MyOrders} />
      <Route path="/account/saved" component={SavedItems} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order/success" component={OrderSuccess} />
      <Route path="/order/bank" component={OrderBank} />

      <Route path="/help/contattaci" component={ContactPage} />
      <Route path="/help/taglie" component={SizeGuidePage} />
      <Route path="/help/condizioni" component={TermsPage} />
      <Route path="/help/pagamenti" component={PaymentsPage} />
      <Route path="/help/spedizioni-resi" component={ShippingPage} />

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
      <Toaster />
    </Layout>
  );
}

export default App;

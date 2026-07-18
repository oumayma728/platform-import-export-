import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RootLayout from "./components/templates/RootLayout";
import ProtectedRoute from "./components/organisms/ProtectedRoute";
import ListingsPage from "./pages/ListingsPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfileCompletionPage from "./pages/ProfileCompletionPage";
import ProfileStatusPage from "./pages/ProfileStatusPage";
import OnboardingListingPage from "./pages/OnboardingListingPage";
import ListingCreatePage from "./pages/ListingCreatePage";
import MyListingsPage from "./pages/MyListingsPage";
import ContactPage from "./pages/ContactPage";
import BillingPage from "./features/billing/pages/BillingPage";
import SubscriptionPage from "./features/billing/pages/SubscriptionPage";
import PaymentHistoryPage from "./features/billing/pages/PaymentHistoryPage";
import PlansPage from "./features/billing/pages/PlansPage";
import InvoiceDetailPage from "./features/billing/pages/InvoiceDetailPage";
import PaymentMethodsPage from "./features/billing/pages/PaymentMethodsPage";
import PaymentPage from "./features/billing/pages/PaymentPage";
import MessagingPage from "./features/messaging/pages/MessagingPage";
import ListingsShowcasePage from "./pages/ListingsShowcasePage";
import MessagesPage from "./features/messaging/pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import FavoritesPage from "./pages/FavoritesPage";
import MatchingPage from "./pages/MatchingPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* RootLayout affiche le header visiteur (non connecte) ou la sidebar utilisateur (connecte) */}
          <Route element={<RootLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/matching"
              element={
                <ProtectedRoute>
                  <MatchingPage />
                </ProtectedRoute>
              }
            />

            {/* Messagerie : apercu public (visiteurs) */}
            <Route path="/Vmessages" element={<MessagesPage />} />

            {/* Messagerie : conversations reelles (utilisateurs connectes) */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <ProtectedRoute>
                  <MessagingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/billing" element={<BillingPage />} />
            <Route
              path="/billing/subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/history"
              element={
                <ProtectedRoute>
                  <PaymentHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/billing/plans" element={<PlansPage />} />
            <Route
              path="/billing/invoices/:id"
              element={
                <ProtectedRoute>
                  <InvoiceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/payment-methods"
              element={
                <ProtectedRoute>
                  <PaymentMethodsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/checkout/:planId"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/listings" element={<ListingsShowcasePage />} />
            <Route
              path="/listings/catalog"
              element={
                <ProtectedRoute>
                  <ListingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            {/* Module a venir : /matching */}
            <Route
              path="/profile/complete"
              element={
                <ProtectedRoute>
                  <ProfileCompletionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/status"
              element={
                <ProtectedRoute>
                  <ProfileStatusPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/listing"
              element={
                <ProtectedRoute>
                  <OnboardingListingPage />
                </ProtectedRoute>
              }
            />
            <Route
  path="/favorites"
  element={<FavoritesPage />}
/>
            <Route
              path="/listings/create"
              element={
                <ProtectedRoute>
                  <ListingCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id/edit"
              element={
                <ProtectedRoute>
                  <ListingCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/mine"
              element={
                <ProtectedRoute>
                  <MyListingsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

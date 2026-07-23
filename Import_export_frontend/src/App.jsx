import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RootLayout from "./components/templates/RootLayout";
import ProtectedRoute from "./components/organisms/ProtectedRoute";
import Spinner from "./components/atoms/Spinner";

import LandingPage from "./pages/LandingPage";

const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const ListingDetailPage = lazy(() => import("./pages/ListingDetailPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfileCompletionPage = lazy(() => import("./pages/ProfileCompletionPage"));
const ProfileStatusPage = lazy(() => import("./pages/ProfileStatusPage"));
const OnboardingListingPage = lazy(() => import("./pages/OnboardingListingPage"));
const ListingCreatePage = lazy(() => import("./pages/ListingCreatePage"));
const MyListingsPage = lazy(() => import("./pages/MyListingsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BillingPage = lazy(() => import("./features/billing/pages/BillingPage"));
const SubscriptionPage = lazy(() => import("./features/billing/pages/SubscriptionPage"));
const PaymentHistoryPage = lazy(() => import("./features/billing/pages/PaymentHistoryPage"));
const PlansPage = lazy(() => import("./features/billing/pages/PlansPage"));
const InvoiceDetailPage = lazy(() => import("./features/billing/pages/InvoiceDetailPage"));
const PaymentMethodsPage = lazy(() => import("./features/billing/pages/PaymentMethodsPage"));
const PaymentPage = lazy(() => import("./features/billing/pages/PaymentPage"));
const MessagingPage = lazy(() => import("./features/messaging/pages/MessagingPage"));
const ListingsShowcasePage = lazy(() => import("./pages/ListingsShowcasePage"));
const MessagesPage = lazy(() => import("./features/messaging/pages/MessagesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const MatchingPage = lazy(() => import("./pages/MatchingPage"));
const AdminDashboardPage = lazy(() => import("./features/admin/pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./features/admin/pages/AdminUsersPage"));
const AdminValidationPage = lazy(() => import("./features/admin/pages/AdminValidationPage"));
const AdminReportsPage = lazy(() => import("./features/admin/pages/AdminReportsPage"));
const AdminHistoryPage = lazy(() => import("./features/admin/pages/AdminHistoryPage"));
const AdminEnterprisesPage = lazy(() => import("./features/admin/pages/AdminEnterprisesPage"));
const AdminBadgesPage = lazy(() => import("./features/admin/pages/AdminBadgesPage"));
const AdminKYBPage = lazy(() => import("./features/admin/pages/AdminKYBPage"));
const AdminReviewsPage = lazy(() => import("./features/admin/pages/AdminReviewsPage"));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner label="Chargement de la page..." />}>
          <Routes>
            {/* RootLayout affiche le header visiteur (non connecte) ou la sidebar utilisateur (connecte) */}
            <Route element={<RootLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/matching"
                                      element={
                                        <ProtectedRoute>
                                          <MatchingPage />
                                        </ProtectedRoute>
                                      }
              />

              {/* Messagerie : apercu public (visiteurs) */}
              <Route path="/Vmessages" element={<MessagesPage />} />

              {/* Messagerie : conversations reelles (utilisateurs connectes) */}
              <Route path="/messages"
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

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
              <Route path="/admin/validation" element={<ProtectedRoute><AdminValidationPage /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute><AdminReportsPage /></ProtectedRoute>} />
              <Route path="/admin/history" element={<ProtectedRoute><AdminHistoryPage /></ProtectedRoute>} />
              <Route path="/admin/enterprises" element={<ProtectedRoute><AdminEnterprisesPage /></ProtectedRoute>} />
              <Route path="/admin/badges" element={<ProtectedRoute><AdminBadgesPage /></ProtectedRoute>} />
              <Route path="/admin/kyb" element={<ProtectedRoute><AdminKYBPage /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewsPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
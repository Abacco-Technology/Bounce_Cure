// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FreeValidation from './pages/FreeValidation';
import IntegrationPage from './pages/IntegrationPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPasswordPage';
import Pricing from './pages/Pricing';
import Contact from './components/Contact';
import About from './pages/About';
import Features from './pages/Features';
import BulkVerification from './pages/BulkVerification';
import Chatbot from './pages/ChatBot';
import Dashboard from './pages/Dashboard/Dashboard';
import FaqSection from './pages/FAQSection';
import Settings from './pages/Settings/Settings';
import Contacts from './pages/ContactManagement/ConatctManagement';
import Campaign from './pages/Campaign/Campaign';
import Automation from './pages/Automation/Automation';
import UserAuthentication from './pages/UserAuthentication/UserAuthentication';
import Verification from './pages/Verification/Verification';
import Analytics from './pages/Analytics/Analytics';
import Support from './pages/Support/Support';
import PricingDash from './pages/Pricing/PricingDash';
import PaymentPage from './pages/Pricing/components/Checkout';
import { UserProvider } from "./components/UserContext";
// import NewCampaignWindow from './pages/Campaign/Components/NewCampaignWindow';
import CreateCampaign from './pages/Campaign/pages/CreateCampaign';
import EditorPage from './pages/Campaign/pages/EditorPage';
import PhoneValidation from './pages/PhoneValidation/PhoneValidation';
import { Toaster } from 'react-hot-toast';

import { NotificationProvider } from "./components/NotificationContext";
import ContactsPage from './pages/ContactManagement/pages/ContactsPage';
import Leads from './pages/ContactManagement/pages/Leads';
import Deals from './pages/ContactManagement/pages/Deals';
import Tasks from './pages/ContactManagement/pages/Tasks';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmail from "./pages/VerifyEmail";
import Templets from './pages/Campaign/pages/Templets';
import CanvasArea from './pages/Campaign/Components/Editor/CanvasArea';
import SendCampaign from './pages/Campaign/pages/SendCampaign';
import AllTemplates from './pages/Campaign/pages/AllTemplats';
import WatsupCampaign from './pages/WatsupCampaign';
import SMSCampaign from './pages/SMSCampaign';
import Signupd from './pages/Pricing/Signupd';

import MultimediaCampaign from './pages/Multimedia/MultimediCampaign';
import WhatsappCampaign from './pages/Multimedia/WhatsappCampaign';
import SMScampaign from './pages/Multimedia/SMScampaign';
import TermsConditions from './pages/Terms&Conditions';
import RefundPolicy from './pages/RefundPolicy';
import Signin from './pages/Pricing/Signin';
import VerifydEmail from './pages/Campaign/pages/VerifydEmail';
import StripeWrapper from './pages/Pricing/components/StripeWrapper';
import Razorpay from './pages/Pricing/components/Razorpay'
import Paypal from './pages/Pricing/components/Paypal'
import CreditCardWrapper from './pages/Pricing/components/CreditCardWrapper'
import ProtectedRoute from "./components/ProtectedRoute";
import PlanProtectedRoute from "./components/PlanProtectedRoute"; // NEW - Plan-based protection
import CampaignTextEditor from './pages/Campaign/Components/Editor/CampaignTextEditor';
import TextTemplates from './pages/Campaign/pages/TextTemplates';
import PrivacyPolicy from './pages/PrivacyPolicy';

import OAuthOutlookCallback from './components/inbox/OAuthOutlookCallback';
import ScrollToTop from './components/ScrollToTop';
import TwilioSetupPage from './pages/Multimedia/TwilioSetupPage';

function App() {
  return (
    <UserProvider>
      <NotificationProvider>
        <Router>
           <ScrollToTop /> 
          <Toaster
            position="top-right"
            containerStyle={{
              zIndex: 999999,
              marginTop: "70px",
            }}
            toastOptions={{
              duration: 3500,
              style: {
                background: 'rgba(15, 23, 42, 0.85)',
                fontSize: "16px",
                fontWeight: "600",
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px'
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
            }}
          />

          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/services/email-campaign" element={<FreeValidation />} />
            <Route path="/services/crm" element={<IntegrationPage />} />
            <Route path="/services/email-verification" element={ <BulkVerification /> } />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/faq" element={<FaqSection />} />
            <Route path="/MultiMediaCampaign" element={<WatsupCampaign />} />
            <Route path="/smscampaign" element={<SMSCampaign />} />
            
            {/* ==================== AUTH ROUTES ==================== */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signupd" element={<Signupd />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* ==================== PAYMENT ROUTES ==================== */}
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/stripe" element={<StripeWrapper />} />
            <Route path="/razorpay" element={<Razorpay />} />
            <Route path="/paypal" element={<Paypal />} />
            <Route path="/creditcard" element={<StripeWrapper />} />
            
            {/* ==================== PROTECTED ROUTES (Auth Only) ==================== */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/email-campaign" element={<ProtectedRoute><Campaign /></ProtectedRoute>} />
            <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/auth" element={<ProtectedRoute><UserAuthentication /></ProtectedRoute>} />
            <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path='/pricingdash' element={<ProtectedRoute><PricingDash /></ProtectedRoute>} />
            <Route path='/phoneValidation' element={<ProtectedRoute><PhoneValidation /></ProtectedRoute>} />
            
            {/* Campaign Routes */}
            {/* <Route path='/new-campaign' element={<ProtectedRoute><NewCampaignWindow /></ProtectedRoute>} /> */}
            <Route path="/create" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="/templetes" element={<ProtectedRoute><Templets /></ProtectedRoute>} />
            <Route path="/canva" element={<ProtectedRoute><CanvasArea /></ProtectedRoute>} />
            <Route path="/send-campaign" element={<ProtectedRoute><SendCampaign /></ProtectedRoute>} />
            <Route path="/all-templates" element={<ProtectedRoute><AllTemplates /></ProtectedRoute>} />
            <Route path="/texteditor" element={<ProtectedRoute><CampaignTextEditor /></ProtectedRoute>} />
            <Route path="/text-templates" element={<ProtectedRoute><TextTemplates /></ProtectedRoute>} />
            <Route path="/verifydemail" element={<ProtectedRoute><VerifydEmail /></ProtectedRoute>} />
            <Route path="/verify-email" element={<ProtectedRoute><VerifyEmail /></ProtectedRoute>} />
            
            {/* Multimedia Campaigns */}
            <Route path="/MultimediaCampaigns" element={<ProtectedRoute><MultimediaCampaign /></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute><WhatsappCampaign /></ProtectedRoute>} />
            <Route path="/sms" element={<ProtectedRoute><SMScampaign /></ProtectedRoute>} />

            <Route path="/oauth/outlook/callback" element={<OAuthOutlookCallback />} />
            <Route path="/twilio-setup" element={<TwilioSetupPage />} />

          
            
            {/* ==================== CRM ROUTES (Auth + Plan Protection) ==================== */}
            {/* These routes require BOTH authentication AND Standard/Premium plan */}
            <Route 
              path="/contacts" 
              element={
                <ProtectedRoute>
                  <PlanProtectedRoute requiresCRM={true}>
                    <Contacts />
                  </PlanProtectedRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/contactsPage" 
              element={
                <ProtectedRoute>
                  <PlanProtectedRoute requiresCRM={true}>
                    <ContactsPage />
                  </PlanProtectedRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/leads" 
              element={
                <ProtectedRoute>
                  <PlanProtectedRoute requiresCRM={true}>
                    <Leads />
                  </PlanProtectedRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/deals" 
              element={
                <ProtectedRoute>
                  <PlanProtectedRoute requiresCRM={true}>
                    <Deals />
                  </PlanProtectedRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <PlanProtectedRoute requiresCRM={true}>
                    <Tasks />
                  </PlanProtectedRoute>
                </ProtectedRoute>
              } 
            />

            {/* ==================== FALLBACK ROUTES ==================== */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <Chatbot />
        </Router>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;
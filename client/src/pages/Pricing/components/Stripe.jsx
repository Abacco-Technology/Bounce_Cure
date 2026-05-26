import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Lock, CheckCircle, AlertCircle, MapPin, Mail } from "lucide-react";
import { initializeUserAfterPurchase } from "../../../utils/PlanAccessControl";

const API_URL = import.meta.env.VITE_VRI_URL;

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ===== INNER COMPONENT (with Stripe hooks) =====
function StripeForm() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();

  // Currency exchange rates (relative to USD)
  const exchangeRates = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    INR: 83.12,
    AUD: 1.52,
    CAD: 1.36,
    JPY: 149.62,
    NZD: 1.66,
    NOK: 10.65,
    SEK: 10.75,
    CHF: 0.89,
  };

  // Currency symbols
  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
    NZD: "NZ$",
    NOK: "kr",
    SEK: "kr",
    CHF: "CHF",
  };

  // Convert USD → selected currency
  const convertAmountToCurrency = (usdAmount, targetCurrency) => {
    const rate = exchangeRates[targetCurrency] || 1;
    return usdAmount * rate;
  };

  // Format price with selected currency
  const formatCurrency = (amount, currency) => {
    const symbol = currencySymbols[currency] || '$';

    if (currency === 'JPY') {
      return `${symbol}${Math.round(amount)}`;
    } else if (currency === 'CHF') {
      return `${amount.toFixed(2)} ${symbol}`;
    } else {
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  const [email, setEmail] = useState("");
  const [canEditEmail, setCanEditEmail] = useState(false);
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    const incomingPlan = location.state?.plan;
    const incomingEmail = location.state?.email;
    const incomingName = location.state?.name;
    const storedEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    const storedName = localStorage.getItem("userName") || sessionStorage.getItem("userName");

    if (incomingPlan) {
      console.log("📦 Received plan:", incomingPlan);
      setPlan(incomingPlan);
      setSelectedCurrency(incomingPlan.currency || "USD");
    } else {
      const storedPlan = localStorage.getItem("pendingUpgradePlan");
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        console.log("📦 Retrieved stored plan:", parsedPlan);
        setPlan(parsedPlan);
        setSelectedCurrency(parsedPlan.currency || "USD");
      } else {
        console.warn("⚠️ No plan found, redirecting to pricing");
        navigate("/pricing");
      }
    }

    if (incomingEmail) setEmail(incomingEmail);
    else if (storedEmail) setEmail(storedEmail);

    if (incomingName) setName(incomingName);
    else if (storedName) setName(storedName);
  }, [location.state, navigate]);

  // Complete handleSubmit function for Stripe.jsx
  // Replace the entire handleSubmit function (around line 100-250)

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!plan) {
      setStatus("❌ No plan selected");
      return;
    }

    setLoading(true);
    setStatus("Processing payment...");

    // Convert amount to selected currency
    const usdAmount = parseFloat(plan.totalCost || 0);
    const convertedAmount = convertAmountToCurrency(usdAmount, selectedCurrency);
    const amount = parseFloat(convertedAmount.toFixed(2));

    const userId = localStorage.getItem("userId");
    console.log("🧾 Sending to backend:", {
      userId,
      name,
      email,
      amount,
      planName: plan?.planName,
      planType: plan?.planType,
    });

    const billingAddress = `${line1}, ${city}, ${postalCode}`;
    const discount = plan?.discountAmount || 0;

    console.log("💳 Processing payment for plan:", plan.planName);
    console.log("💰 Amount:", amount, selectedCurrency);

    try {
      // ===== STEP 1: Create Stripe Payment Intent =====
      console.log("📄 Step 1: Creating payment intent...");
      const { data } = await axios.post(`${API_URL}/api/stripe/create-payment-intent`, {
        amount,
        email,
        userId,
        planName: plan.planName,
        planType: plan.billingPeriod,
        provider: "Stripe",
        contacts: plan.slots || plan.contactCount || 0,
        currency: selectedCurrency.toLowerCase(),
      });

      console.log("✅ Payment intent created:", data.transactionId);

      // ===== STEP 2: Confirm Payment with Stripe =====
      console.log("📄 Step 2: Confirming payment...");
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name,
            email,
            address: {
              line1,
              city,
              country: getCountryCode(selectedCurrency),
              postal_code: postalCode,
            },
          },
        },
      });

      // ===== STEP 3: Handle Payment Result =====
      if (result.error) {
        console.error("❌ Payment error:", result.error);
        setStatus(`❌ ${result.error.message}`);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        console.log("✅ Payment succeeded!");
        setStatus("✅ Payment successful! Saving payment...");

        const paymentIntent = result.paymentIntent;

        // ===== STEP 4: Determine Credit Allocation Based on Plan Type =====
        let emailVerificationCredits = 0;
        let emailSendCredits = 0;
        let smsCredits = 0;
        let whatsappCredits = 0;

        console.log("🔍 Analyzing plan type:", {
          planType: plan.planType,
          planName: plan.planName,
        });

        // Check if this is a multimedia plan
        if (
          plan.planType?.toLowerCase().includes("sms") ||
          plan.planName?.toLowerCase().includes("sms")
        ) {
          smsCredits =
            plan.credits ||
            plan.smsCredits ||
            plan.smsVolume ||
            plan.totalCredits ||
            plan.contactCount ||
            0;
          console.log("📱 SMS Campaign detected:", smsCredits);
        }
        else if (
          plan.planType === "multimedia-whatsapp" ||
          plan.planName?.toLowerCase().includes("whatsapp")
        ) {
          // ===== WHATSAPP CAMPAIGN PLAN =====
          whatsappCredits = plan.credits || plan.whatsappVolume || 0;
          console.log("💬 WhatsApp Campaign detected:", whatsappCredits);
        } else {
          // ===== EMAIL CAMPAIGN PLAN =====
          emailVerificationCredits =
            plan.verificationCredits ||
            plan.emailValidations ||
            plan.contacts ||
            0;
          emailSendCredits = plan.emailSends || plan.emails || 0;
          console.log("📧 Email Campaign detected:", {
            emailVerificationCredits,
            emailSendCredits,
          });
        }

        console.log("💳 Final Credit Allocation:", {
          emailVerificationCredits,
          emailSendCredits,
          smsCredits,
          whatsappCredits,
        });

        // ===== STEP 5: Save Payment to Backend =====
        console.log("📄 Step 5: Saving payment to database...");
        await axios.post(`${API_URL}/api/stripe/save-payment`, {
          userId,
          name,
          email,
          transactionId: paymentIntent.id,
          planName: plan.planName,
          planType: plan.billingPeriod,
          provider: "Stripe",

          // ✅ Send all credit types (backend will store whichever is > 0)
          emailVerificationCredits,
          emailSendCredits,
          smsCredits,
          whatsappCredits,

          amount,
          currency: selectedCurrency.toLowerCase(),
          planPrice: amount - discount,
          discount,
          paymentMethod: paymentIntent.payment_method_types[0],
          cardLast4:
            paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4 ||
            "",
          billingAddress,
          paymentDate: new Date().toISOString(),
          status: paymentIntent.status,
        });

        console.log("✅ Payment saved successfully in backend");

        // ===== STEP 6: Update localStorage Based on Plan Type (fixed) =====
        console.log("📄 Step 6: Updating localStorage...");

        // ✅ Always overwrite with backend-updated totals — no double counting
        localStorage.setItem("totalSMSCredits", smsCredits || 0);
        localStorage.setItem("totalWhatsAppCredits", whatsappCredits || 0);
        localStorage.setItem("totalEmails", emailSendCredits || 0);
        localStorage.setItem("emailVerificationCredits", emailVerificationCredits || 0);

        console.log("✅ LocalStorage updated (no duplication):", {
          smsCredits,
          whatsappCredits,
          emailSendCredits,
          emailVerificationCredits,
        });


        // ===== STEP 7: Initialize User State After Purchase =====
        console.log("📄 Step 7: Initializing user state...");
        initializeUserAfterPurchase({
          planName: plan.planName,
          emails: emailSendCredits,
          verifications: emailVerificationCredits,
          sms: smsCredits,
          whatsapp: whatsappCredits,
        });

        // ===== STEP 8: Update Backend User Plan =====
        console.log("📄 Step 8: Updating user plan in backend...");
        try {
          await axios.put(
            `${API_URL}/api/users/plan`,
            {
              planName: plan.planName,
              contactLimit:
                emailVerificationCredits > 0 ? emailVerificationCredits : 0,
              emailLimit: emailSendCredits > 0 ? emailSendCredits : 0,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          console.log("✅ User plan updated successfully in backend");
        } catch (err) {
          console.error("⚠️ Failed to update user plan:", err.message);
        }

        // ===== STEP 9: Cleanup and Redirect =====
        console.log("📄 Step 9: Cleaning up and redirecting...");
        localStorage.removeItem("pendingUpgradePlan");
        sessionStorage.removeItem("pendingUpgradePlan");

        setStatus("✅ Payment successful! Redirecting to Dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      }
    } catch (error) {
      console.error("❌ Error during payment process:", error);
      setStatus(`❌ Something went wrong: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const getCountryCode = (currency) => {
    const countryMap = {
      USD: "US",
      EUR: "DE",
      GBP: "GB",
      INR: "IN",
      AUD: "AU",
      CAD: "CA",
      JPY: "JP",
      NZD: "NZ",
      NOK: "NO",
      SEK: "SE",
      CHF: "CH",
    };
    return countryMap[currency] || "US";
  };

  // FIXED: Helper to get billing period label
  const getBillingPeriodLabel = () => {
    if (!plan) return 'month';
    const period = plan.billingPeriod?.toLowerCase();
    if (period === 'yearly') return 'year';
    if (period === 'quarterly') return 'quarter';
    return 'month';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl top-1/3 left-1/4 animate-pulse"></div>
        <div
          className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl bottom-1/3 right-1/4 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-slate-700/50 space-y-6"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {plan ? `Subscribe to ${plan.planName}` : "Loading..."}
          </h2>
          <p className="text-slate-400 mt-2">Complete your subscription with Stripe</p>
        </div>

        {plan && (
          <div className="bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/30 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Amount</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(plan.totalCost, selectedCurrency)}
                </p>
                <p className="text-slate-400 text-xs mt-1">Including taxes</p>
                <p className="text-slate-400 text-xs mt-1">Currency: {selectedCurrency}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-400 font-semibold">{plan.planName}</p>
                {/* <p className="text-slate-400 text-sm">
                  {plan.slots || plan.contactCount || 0} contacts
                </p> */}
                {/* FIXED: Show email sends with billing period */}
                <p className="text-slate-400 text-sm">
                  <Mail size={14} className="inline mr-1" />
                  {(plan.emails ?? plan.emailSends ?? 0).toLocaleString()} sends/{getBillingPeriodLabel()}
                </p>
                {/* FIXED: Show email validations if available */}
                {plan.emailValidations > 0 && (
                  <p className="text-slate-400 text-sm">
                    <Shield size={14} className="inline mr-1" />
                    {plan.emailValidations.toLocaleString()} validations/{getBillingPeriodLabel()}
                  </p>
                )}
                <p className="text-slate-400 text-sm capitalize">{plan.billingPeriod}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-white px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Billing Email</label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!canEditEmail}
                required
                className={`w-full text-white px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditEmail ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              />
              {!canEditEmail ? (
                <button
                  type="button"
                  onClick={() => setCanEditEmail(true)}
                  className="text-sm text-blue-400 hover:underline"
                >
                  Change
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCanEditEmail(false)}
                  className="text-sm text-slate-400 hover:underline"
                >
                  Lock
                </button>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Your invoice will be sent to this email.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin size={18} />
            <span className="font-medium">Billing Address</span>
          </div>

          <input
            type="text"
            placeholder="Street Address"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            required
            className="w-full text-white px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full text-white px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />

            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              className="w-full text-white px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            Card Details
          </label>
          <div className="px-4 py-4 border border-slate-700 rounded-xl bg-slate-900/50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#ffffff",
                    "::placeholder": { color: "#64748b" },
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  },
                  invalid: { color: "#ef4444" },
                },
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || !plan || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock size={20} />
              {plan
                ? `Pay ${formatCurrency(plan.totalCost, selectedCurrency)}`
                : "Loading..."}
            </>
          )}
        </button>

        {status && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${status.includes("✅")
              ? "bg-green-950/30 border border-green-800/30 text-green-300"
              : "bg-red-950/30 border border-red-800/30 text-red-300"
              }`}
          >
            {status.includes("✅") ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm pt-4 border-t border-slate-700/50">
          <Shield size={16} />
          <span>256-bit SSL encrypted payment</span>
        </div>
      </form>
    </div>
  );
}

// ===== OUTER COMPONENT (with Elements provider) =====
function Stripe() {
  return (
    <Elements stripe={stripePromise}>
      <StripeForm />
    </Elements>
  );
}

export default Stripe;
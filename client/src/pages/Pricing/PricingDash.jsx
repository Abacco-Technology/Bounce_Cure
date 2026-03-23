// src/pages/Pricing/PricingDash.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheckBig, CircleDot, User, Mail, Headphones, Check, X, Shield, ArrowLeft, ArrowRight, MessageSquare, Phone } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { setUserPlan } from "../../utils/PlanAccessControl";
import MultiMediaPricing from "./MultiMediaPricing";

// Email Verification Plans Component
const EmailValidationPlans = ({ selectedCurrency: propCurrency, currencyRates, onClose, navigate }) => {
  const [selectedVerificationTier, setSelectedVerificationTier] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(propCurrency || 'USD');

  const rates = currencyRates || {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    INR: { symbol: '₹', rate: 88.12 },
    AUD: { symbol: 'A$', rate: 1.53 },
    CAD: { symbol: 'C$', rate: 1.36 },
    JPY: { symbol: '¥', rate: 149.5 },
    NZD: { symbol: 'NZ$', rate: 1.67 },
    NOK: { symbol: 'kr', rate: 10.87 },
    SEK: { symbol: 'kr', rate: 10.96 },
    CHF: { symbol: 'CHF', rate: 0.88 }
  };

  const verificationTiers = [
    { credits: 10000 },
    { credits: 20000 },
    { credits: 50000 },
    { credits: 75000 },
    { credits: 100000 },
    { credits: Infinity, label: 'Unlimited' }
  ];

  const getTierPricing = (credits) => {
    let basePriceUSD = 0;
    let discountPercent = 25;

    if (credits === Infinity) {
      basePriceUSD = 1500;
      discountPercent = 30;
    } else {
      basePriceUSD = credits * 0.01;
      discountPercent = 25;
    }

    const discountedPriceUSD = basePriceUSD * (1 - discountPercent / 100);
    return { basePriceUSD, discountedPriceUSD, discountPercent };
  };

  const formatPrice = (priceUSD) => {
    const rate = rates[selectedCurrency]?.rate || 1;
    const symbol = rates[selectedCurrency]?.symbol || '$';
    const convertedPrice = priceUSD * rate;

    if (selectedCurrency === 'JPY') {
      return `${symbol}${Math.round(convertedPrice).toLocaleString()}`;
    }
    if (selectedCurrency === 'CHF') {
      return `${convertedPrice.toFixed(2)} ${symbol}`;
    }
    return `${symbol}${convertedPrice.toFixed(2)}`;
  };

  const handleBuyVerification = (tier) => {
    const { basePriceUSD, discountedPriceUSD } = getTierPricing(tier.credits);
    const rate = rates[selectedCurrency]?.rate || 1;
    const convertedPrice = discountedPriceUSD * rate;

    const isUnlimited = tier.credits === Infinity;
    const verificationPlan = {
      planName: isUnlimited
        ? 'Unlimited Email Verification'
        : `${tier.credits.toLocaleString()} Email Verifications`,
      planType: 'email-verification',
      originalBasePrice: basePriceUSD * rate,
      basePrice: convertedPrice,
      discountAmount: (basePriceUSD - discountedPriceUSD) * rate,
      periodPrice: convertedPrice,
      billingPeriod: 'one-time',
      subtotal: convertedPrice,
      taxRate: 0.1,
      tax: convertedPrice * 0.1,
      totalCost: convertedPrice * 1.1,
      verificationCredits: isUnlimited ? 'Unlimited' : tier.credits,
      features: [
        'Real-time verification',
        'Syntax & format validation',
        'Domain & MX record check',
        'Disposable email detection',
        ...(isUnlimited ? ['Priority support', 'API access'] : [])
      ],
      currency: selectedCurrency,
      currencySymbol: rates[selectedCurrency]?.symbol || '$',
      isFromPricingDash: false,
      pricingModel: 'email-verification',
    };

    localStorage.setItem('pendingUpgradePlan', JSON.stringify(verificationPlan));
    sessionStorage.setItem('pendingUpgradePlan', JSON.stringify(verificationPlan));

    const isLoggedIn = !!localStorage.getItem('authToken');

    if (!isLoggedIn) {
      navigate('/signin', {
        state: {
          plan: verificationPlan,
          redirectTo: '/payment',
        },
      });
    } else {
      navigate('/payment', {
        state: { plan: verificationPlan },
      });
    }
  };

  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Pricing Plans</span>
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-[#c2831f] mr-3" />
            <h1 className="text-5xl font-bold text-[#c2831f]">
              Email Verification Plans
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Ensure your email lists are clean and deliverable with our professional email verification service
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-[#1e1e1e] rounded-xl p-3 inline-flex items-center gap-3 border-2 border-gray-700">
            <span className="text-gray-400 text-sm px-2">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-[#111] text-white rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#c2831f]"
            >
              {Object.keys(rates).map((code) => (
                <option key={code} value={code}>
                  {code} ({rates[code].symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {verificationTiers.map((tier, index) => {
            const { basePriceUSD, discountedPriceUSD, discountPercent } = getTierPricing(tier.credits);
            const isUnlimited = tier.credits === Infinity;
            const isPopular = tier.credits === 50000;

            return (
              <div
                key={index}
                className={`relative bg-[#111] rounded-2xl p-8 border-2 transition-all hover:scale-105 hover:shadow-xl ${
                  isPopular
                    ? 'border-[#c2831f] shadow-lg shadow-[#c2831f]/20'
                    : 'border-gray-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#c2831f] text-black px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center mb-6">
                  <Mail
                    className={`w-10 h-10 mx-auto mb-4 ${
                      isPopular ? 'text-[#c2831f]' : 'text-gray-400'
                    }`}
                  />
                  <h3 className="text-3xl font-bold mb-2">
                    {isUnlimited ? 'Unlimited' : tier.credits.toLocaleString()}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {isUnlimited ? 'Verification Credits' : 'Email Verifications'}
                  </p>
                </div>

                <div className="text-center mb-8 pb-6 border-b border-gray-700">
                  <div className="text-4xl font-bold text-green-400 mb-1">
                    {formatPrice(discountedPriceUSD)}
                  </div>
                  <div className="text-gray-400 line-through mb-1">
                    {formatPrice(basePriceUSD)}
                  </div>
                  <div className="text-sm text-yellow-400 font-semibold">
                    {discountPercent}% OFF
                  </div>
                  {!isUnlimited && (
                    <div className="text-gray-400 text-sm mt-1">
                      {formatPrice(0.01)} per verification
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 mr-2" /> Real-time verification
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 mr-2" /> Syntax & format validation
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 mr-2" /> Domain & MX record check
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 mr-2" /> Disposable email detection
                  </div>
                  {isUnlimited && (
                    <>
                      <div className="flex items-center text-sm text-gray-300">
                        <Check className="w-5 h-5 text-green-400 mr-2" /> Priority support
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Check className="w-5 h-5 text-green-400 mr-2" /> API access
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleBuyVerification(tier)}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isPopular
                      ? 'bg-[#c2831f] hover:bg-[#dba743] text-black'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  Buy Now <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>All verification credits are valid for one month from purchase date</p>
          <p className="mt-2">Need more? Contact us for custom enterprise solutions</p>
        </div>
      </div>
    </div>
  );
};

// Main Pricing Dashboard Component
const PricingDash = () => {
  const navigate = useNavigate();
  const [pricingType, setPricingType] = useState("monthly");
  const [selectedContacts, setSelectedContacts] = useState(500);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showMultiMedia, setShowMultiMedia] = useState(false);

  // ✅ Custom contacts state
  const [isCustomContacts, setIsCustomContacts] = useState(false);
  const [customContactInput, setCustomContactInput] = useState("");

  // Currency exchange rates
  const exchangeRates = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    INR: 88.12,
    AUD: 1.52,
    CAD: 1.36,
    JPY: 149.62,
    NZD: 1.66,
    NOK: 10.65,
    SEK: 10.75,
    CHF: 0.89,
  };

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

  const currencyRates = Object.keys(exchangeRates).reduce((acc, code) => {
    acc[code] = {
      symbol: currencySymbols[code],
      rate: exchangeRates[code]
    };
    return acc;
  }, {});

  // ✅ Effective contacts — uses custom input if active, otherwise preset dropdown
  const effectiveContacts = isCustomContacts
    ? Math.max(1, parseInt(customContactInput) || 0)
    : selectedContacts;

  if (showEmailVerification) {
    return (
      <DashboardLayout>
        <div className="mt-20">
          <EmailValidationPlans
            selectedCurrency={selectedCurrency}
            currencyRates={currencyRates}
            onClose={() => setShowEmailVerification(false)}
            navigate={navigate}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (showMultiMedia) {
    return (
      <DashboardLayout>
        <div className="mt-20">
          <MultiMediaPricing
            selectedCurrency={selectedCurrency}
            currencyRates={currencyRates}
            onClose={() => setShowMultiMedia(false)}
            navigate={navigate}
          />
        </div>
      </DashboardLayout>
    );
  }

  const formatPrice = (price) => {
    const convertedPrice = price * exchangeRates[selectedCurrency];
    const symbol = currencySymbols[selectedCurrency];
    if (selectedCurrency === "JPY") {
      return `${symbol}${Math.round(convertedPrice)}`;
    } else if (selectedCurrency === "CHF") {
      return `${Math.round(convertedPrice * 100) / 100} ${symbol}`;
    } else {
      return `${symbol}${convertedPrice.toFixed(2)}`;
    }
  };

  const perContactRates = {
    essentials: {
      500: 0.05,
      1000: 0.05,
      2500: 0.05,
      5000: 0.05,
      10000: 0.04,
      20000: 0.04,
      30000: 0.03,
      40000: 0.03,
      50000: 0.03
    },
    standard: {
      500: 0.08,
      1000: 0.08,
      2500: 0.07,
      5000: 0.07,
      10000: 0.06,
      20000: 0.06,
      30000: 0.05,
      40000: 0.05,
      50000: 0.04
    },
    premium: {
      500: 0.10,
      1000: 0.10,
      2500: 0.08,
      5000: 0.08,
      10000: 0.07,
      20000: 0.07,
      30000: 0.06,
      40000: 0.06,
      50000: 0.05
    }
  };

  const contactTiers = [
    { value: 500, label: "500" },
    { value: 1000, label: "1,000" },
    { value: 2500, label: "2,500" },
    { value: 5000, label: "5,000" },
    { value: 10000, label: "10,000" },
    { value: 20000, label: "20,000" },
    { value: 30000, label: "30,000" },
    { value: 40000, label: "40,000" },
    { value: 50000, label: "50,000" },
    { value: 100000, label: "1,00,000" },
    { value: 150000, label: "1,50,000" },
    { value: 200000, label: "2,00,000" },
  ];

  const plans = [
    {
      name: "Essentials",
      tagline: "Send the right content at the right time with testing and scheduling features",
      users: 3,
      support: "Standard Support",
      contactLimit: 50000,
      emailSendsPerContact: 1,
      emailValidationPerContact: 0,
      hasWhatsApp: false,
      hasCRM: false,
      isDiscounted: true,
      emailValidations: 50000 * 0,
      emailSends: 50000 * 1,
      smsVolume: 0,
      whatsappVolume: 0
    },
    {
      name: "Standard",
      tagline: "Sell even more with personalization, optimization tools, and enhanced automations",
      users: 5,
      support: "Priority Support",
      contactLimit: 50000,
      emailSendsPerContact: 1,
      emailValidationPerContact: 1,
      hasWhatsApp: false,
      hasCRM: false,
      highlight: true,
      isDiscounted: true,
      emailValidations: 50000 * 1,
      emailSends: 50000 * 1,
      smsVolume: 5000,
      whatsappVolume: 2000
    },
    {
      name: "Premium",
      tagline: "Scale fast with dedicated onboarding, unlimited contacts, and priority support; built for teams",
      users: "Unlimited",
      support: "Dedicated Support",
      features: [
        "Email marketing", "Email validation", "SMS marketing",
        "WhatsApp campaigns", "CRM access", "Advanced automation",
        "A/B testing", "Priority support", "Custom integrations"
      ],
      contactLimit: Infinity,
      emailSendsPerContact: 1,
      emailValidationPerContact: 1,
      hasCRM: true,
      isDiscounted: true,
      emailValidations: 100000,
      emailSends: 100000,
      smsVolume: 10000,
      whatsappVolume: 5000
    },
  ];

  const features = [
    {
      category: "Core Features",
      items: [
        { name: "Email Scheduling", plans: [false, true, true, true] },
        { name: "Custom Templates", plans: [false, false, true, true] },
        { name: "Dynamic Content", plans: [false, false, true, true] },
        { name: "Advanced Insights", plans: [false, false, true, true] }
      ]
    },
    {
      category: "Contacts & Audience",
      items: [
        { name: "Audiences", plans: ["1", "3", "5", "Multiple"] },
        { name: "Tags", plans: [false, false, false, true] },
        { name: "Basic Segmentation", plans: [true, true, true, true] },
        { name: "Advanced Segmentation", plans: [false, false, true, true] },
        { name: "Contact Scoring", plans: [false, false, true, true] },
        { name: "Customer Lifetime Value", plans: [false, false, true, true] }
      ]
    },
    {
      category: "Email & Content Creation",
      items: [
        { name: "Email Campaigns", plans: [true, true, true, true] },
        { name: "Pre-built Templates", plans: ["Limited", true, true, true] },
        { name: "Creative Assistant", plans: ["Limited", "Limited", true, true] },
        { name: "Custom-coded Templates", plans: [false, false, true, true] },
        { name: "Content Optimizer", plans: [false, false, true, true] },
        { name: "Dynamic Content", plans: [false, false, true, true] }
      ]
    },
    {
      category: "Marketing Automation",
      items: [
        { name: "Email Automation", plans: ["Basic", true, true, true] },
        { name: "Automation Triggers", plans: ["Limited", true, true, true] }
      ]
    },
    {
      category: "Reporting & Analytics",
      items: [
        { name: "Basic Reporting", plans: [true, true, true, true] },
        { name: "Advanced Reporting", plans: [false, false, true, true] },
        { name: "Campaign Performance", plans: [true, true, true, true] },
        { name: "Click Map", plans: [true, true, true, true] },
        { name: "Content Optimizer", plans: [false, false, true, true] },
        { name: "Campaign Manager", plans: [false, false, true, true] }
      ]
    },
    {
      category: "Support & Services",
      items: [
        { name: "Email Support", plans: [true, true, true, true] },
        { name: "Chat Support", plans: [false, true, true, true] },
        { name: "24/7 Support", plans: [false, false, true, true] },
        { name: "Phone Support", plans: [false, false, false, true] },
        { name: "Priority Support", plans: [false, false, false, true] },
        { name: "Onboarding", plans: [false, false, "Basic", "Dedicated"] },
        { name: "Personalized Onboarding", plans: [false, false, false, true] }
      ]
    }
  ];

  const getPlanContactLimit = (planType) => {
    const contactCount = parseInt(localStorage.getItem("totalContacts")) || 0;
    switch (planType?.toLowerCase()) {
      case "free": return 50;
      case "essentials": return 50000;
      case "standard": return 150000;
      case "premium": return Infinity;
      default: return contactCount;
    }
  };

  // ✅ Uses effectiveContacts
  const isPlanAvailable = (planName) => effectiveContacts <= getPlanContactLimit(planName);

  const calculateEmailSends = (plan, contacts) => {
    if (plan.name === "Free") return 50;
    const multiplier =
      pricingType === "yearly" ? 12 :
      pricingType === "quarterly" ? 3 : 1;
    return contacts * plan.emailSendsPerContact * multiplier;
  };

  const calculateEmailValidations = (plan, contacts) => {
    const multiplier =
      pricingType === "yearly" ? 12 :
      pricingType === "quarterly" ? 3 : 1;
    return contacts * plan.emailValidationPerContact * multiplier;
  };

  const calculatePrice = (plan, contacts) => {
    if (plan.name === "Free") return 0;
    const planKey = plan.name.toLowerCase();
    const rates = perContactRates[planKey];
    if (!rates) return 0;

    // ✅ Fixed: iterate tiers in ascending order, use the rate of the
    // LAST tier the contact count meets or exceeds.
    // This ensures price always increases as contacts increase —
    // e.g. 21,498 stays at the 20,000-tier rate ($0.04), not the 30,000-tier rate ($0.03).
    const tierBreakpoints = [500, 1000, 2500, 5000, 10000, 20000, 30000, 40000, 50000];
    let rate = rates[500];
    for (const tier of tierBreakpoints) {
      if (contacts >= tier) rate = rates[tier];
      else break;
    }

    const monthlyPrice = contacts * rate;
    const multiplier =
      pricingType === "yearly" ? 12 :
      pricingType === "quarterly" ? 3 : 1;
    return monthlyPrice * multiplier;
  };

  const calculateDiscountedPrice = (fullPrice, isNewCustomer) => {
    return isNewCustomer ? fullPrice * 0.5 : fullPrice;
  };

  const handleBuyNow = (plan, contacts) => {
    const isLoggedIn = !!localStorage.getItem("authToken");
    const hasPurchasedBefore = localStorage.getItem("hasPurchasedBefore") === "true";

    const monthlyFullPrice = parseFloat(calculatePrice(plan, contacts)) / (
      pricingType === "yearly" ? 12 :
      pricingType === "quarterly" ? 3 : 1
    );
    const isNewCustomer = !hasPurchasedBefore;
    const monthlyPrice = calculateDiscountedPrice(monthlyFullPrice, isNewCustomer);

    const multiplier =
      pricingType === "yearly" ? 12 :
      pricingType === "quarterly" ? 3 : 1;
    const price = monthlyPrice * multiplier;
    const originalPrice = monthlyFullPrice * multiplier;

    const emailSendLimit = calculateEmailSends(plan, contacts);
    const emailValidationLimit = calculateEmailValidations(plan, contacts);

    const convertedBasePrice = price * exchangeRates[selectedCurrency];
    const convertedOriginalPrice = originalPrice * exchangeRates[selectedCurrency];
    const convertedTotal = convertedBasePrice * 1.1;

    const planDetails = {
      planName: plan.name,
      originalBasePrice: convertedOriginalPrice,
      basePrice: isNewCustomer ? convertedOriginalPrice * 0.5 : convertedOriginalPrice,
      discountApplied: isNewCustomer,
      discount: isNewCustomer ? 0.5 : 0,
      discountAmount: isNewCustomer ? convertedOriginalPrice * 0.5 : 0,
      billingPeriod: pricingType,
      total: convertedTotal,
      totalCost: convertedTotal,
      contactCount: contacts,
      slots: contacts,
      emailSends: emailSendLimit,
      emailValidations: emailValidationLimit,
      hasWhatsApp: plan.hasWhatsApp,
      hasCRM: plan.hasCRM,
      isFromPricingDash: true,
      isNewUser: isNewCustomer,
      currency: selectedCurrency,
      currencySymbol: currencySymbols[selectedCurrency] || "$",
    };

    localStorage.setItem("pendingUpgradePlan", JSON.stringify(planDetails));
    sessionStorage.setItem("pendingUpgradePlan", JSON.stringify(planDetails));
    localStorage.setItem("pendingPlanUpgrade", plan.name);

    navigate(isLoggedIn ? "/payment" : "/signin", {
      state: { plan: planDetails, redirectTo: "/payment" },
    });
  };

  const renderCell = (val, idx) => (
    <td key={idx} className="text-center py-3 px-3">
      {typeof val === "boolean"
        ? val
          ? <Check size={16} className="text-green-500 mx-auto" />
          : <X size={16} className="text-red-500 mx-auto" />
        : val}
    </td>
  );

  // ✅ Fixed: same >= logic so cost-per-contact display is consistent with calculatePrice
  const getRateForContacts = (planKey, contacts) => {
    const rates = perContactRates[planKey];
    if (!rates) return 0;
    const tierBreakpoints = [500, 1000, 2500, 5000, 10000, 20000, 30000, 40000, 50000];
    let rate = rates[500];
    for (const tier of tierBreakpoints) {
      if (contacts >= tier) rate = rates[tier];
      else break;
    }
    return rate;
  };

  return (
    <DashboardLayout>
      <div className="text-white min-h-screen py-10 px-4 mt-20">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Header with Contact and Currency Selector */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-10 gap-4">
            <h2 className="text-2xl font-bold text-[#c2831f] mb-4 md:mb-0">Choose Plans</h2>
            <div className="flex flex-wrap items-start gap-4">

              {/* ✅ Contacts Selector with Custom Option */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-gray-400">Contacts:</label>
                  <select
                    className="bg-[#1e1e1e] text-white border border-gray-600 rounded px-3 py-2 text-sm"
                    value={isCustomContacts ? "custom" : selectedContacts}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomContacts(true);
                        setCustomContactInput("");
                      } else {
                        setIsCustomContacts(false);
                        setSelectedContacts(Number(e.target.value));
                      }
                    }}
                  >
                    {contactTiers.map((tier) => (
                      <option key={tier.value} value={tier.value}>{tier.label}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                {/* ✅ Custom input row — shown only when Custom is selected */}
                {isCustomContacts && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 220"
                      value={customContactInput}
                      onChange={(e) => setCustomContactInput(e.target.value)}
                      className="bg-[#1e1e1e] text-white border border-[#c2831f] rounded px-3 py-2 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-[#c2831f]"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setIsCustomContacts(false);
                        setSelectedContacts(Math.max(1, parseInt(customContactInput) || 500));
                        setCustomContactInput("");
                      }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                      title="Clear custom input"
                    >
                      ✕
                    </button>
                    {customContactInput && parseInt(customContactInput) > 0 && (
                      <span className="text-xs text-[#c2831f] font-semibold">
                        {parseInt(customContactInput).toLocaleString()} contacts
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400">Currency:</label>
                <select
                  className="bg-[#1e1e1e] text-white border border-gray-600 rounded px-3 py-2 text-sm"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="NZD">NZD (NZ$)</option>
                  <option value="NOK">NOK (kr)</option>
                  <option value="SEK">SEK (kr)</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>
          </div>

          {/* Monthly / Quarterly / Yearly Toggle + Email Verification + Multi-Media Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20">
            <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-gray-700">
              {["monthly", "quarterly", "yearly"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`px-6 py-3 text-sm font-medium transition-all duration-200
                    ${pricingType === type
                      ? "bg-[#c2831f] text-black"
                      : "bg-[#1e1e1e] text-gray-300 hover:bg-gray-700"}
                    ${type === "monthly" ? "rounded-l-lg" : ""}
                    ${type === "yearly" ? "rounded-r-lg" : ""}
                  `}
                  onClick={() => setPricingType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Plans
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowEmailVerification(true)}
              className="inline-flex items-center gap-3 bg-[#c2831f]
                        text-black px-4 py-3 rounded-xl font-semibold text-lg
                        hover:shadow-lg hover:shadow-[#c2831f]/50 transition-all hover:scale-105"
            >
              <Shield className="w-6 h-6" />
              Email Verification Plans
            </button>

            <button
              onClick={() => setShowMultiMedia(true)}
              className="inline-flex items-center gap-3 bg-[#c2831f]
                        text-black px-4 py-3 rounded-xl font-semibold text-lg
                        hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              <MessageSquare className="w-6 h-6" />
              Multi Media Campigns
            </button>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const monthlyFullPrice = parseFloat(calculatePrice(plan, effectiveContacts)) / (
                pricingType === "yearly" ? 12 :
                pricingType === "quarterly" ? 3 : 1
              );
              const multiplier =
                pricingType === "yearly" ? 12 :
                pricingType === "quarterly" ? 3 : 1;
              const price = monthlyFullPrice * multiplier;
              const planAvailable = isPlanAvailable(plan.name);
              const isNewCustomer = !localStorage.getItem("hasPurchasedBefore");
              const discountedPrice = calculateDiscountedPrice(monthlyFullPrice, isNewCustomer) * multiplier;

              // ✅ Uses effectiveContacts
              const emailSends = calculateEmailSends(plan, effectiveContacts);
              const emailValidations = calculateEmailValidations(plan, effectiveContacts);

              return (
                <div
                  key={plan.name}
                  className={`bg-[#111] rounded-xl p-6 border relative shadow transition ${
                    plan.highlight
                      ? "border-yellow-500 -mt-10 z-10"
                      : "border-gray-700"
                  } ${!planAvailable ? "opacity-60" : ""}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      Best value
                    </div>
                  )}
                  {!planAvailable && (
                    <div className="absolute top-0 left-0 right-0 bg-gray-700 text-white text-center py-2 text-sm font-bold z-10">
                      NOT AVAILABLE
                    </div>
                  )}

                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.tagline}</p>

                  <div className="mb-4">
                    {plan.name === "Free" ? (
                      <div className="text-2xl font-bold">
                        {formatPrice(price)}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </div>
                    ) : (
                      <>
                        {isNewCustomer && plan.isDiscounted ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <div className="text-2xl font-bold">
                                {formatPrice(discountedPrice)}
                                <span className="text-sm font-normal text-gray-500">/{pricingType}</span>
                              </div>
                            </div>
                            <div className="text-xl line-through text-gray-500">
                              {formatPrice(price)}
                              <span className="text-sm font-normal text-gray-500">/{pricingType}</span>
                            </div>
                            <div className="text-sm text-green-400 font-semibold">50% OFF for new customers!</div>
                          </>
                        ) : (
                          <div className="text-2xl font-bold">
                            {formatPrice(price)}
                            <span className="text-sm font-normal text-gray-500">/{pricingType}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="text-sm text-gray-300 mb-4 space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <User size={16} /> Users: {plan.users}
                    </li>

                    <li className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>
                          Email Sends:{" "}
                          {plan.name === "Free"
                            ? "50"
                            : `${emailSends.toLocaleString()}`}
                        </span>
                      </div>

                      {plan.name !== "Free" && (
                        <div className="ml-6 text-xs text-gray-400">
                          {(() => {
                            const planKey = plan.name.toLowerCase();
                            const rate = getRateForContacts(planKey, effectiveContacts);
                            if (!rate) return null;
                            return (
                              <>
                                Cost per contact:{" "}
                                <span className="text-[#c2831f] font-semibold">{formatPrice(rate)}</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </li>

                    {plan.emailValidationPerContact > 0 && (
                      <li className="flex items-center gap-2">
                        <Check size={16} /> Email Validations: {emailValidations.toLocaleString()}
                      </li>
                    )}

                    {plan.hasWhatsApp && (
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" /> WhatsApp Campaigns
                      </li>
                    )}
                    {plan.hasSMS && (
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" /> SMS Campaigns
                      </li>
                    )}
                    {plan.hasCRM && (
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" /> CRM Access
                      </li>
                    )}

                    <li className="flex items-center gap-2">
                      <Headphones size={16} /> Support: {plan.support}
                    </li>
                  </ul>

                  <button
                    onClick={() => handleBuyNow(plan, effectiveContacts)}
                    className={`mt-5 w-full font-semibold py-2 rounded cursor-pointer ${
                      plan.name === "Free"
                        ? "bg-gray-700 text-gray-400"
                        : planAvailable
                        ? "bg-[#c2831f] text-black hover:bg-[#dba743]"
                        : "bg-gray-700 text-gray-400"
                    }`}
                    disabled={plan.name === "Free" || !planAvailable}
                  >
                    {plan.name === "Free"
                      ? "Current Plan"
                      : planAvailable
                      ? "Buy Now"
                      : "Upgrade Required"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-[#c2831f] mb-6 text-center">Compare All Features</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-4 w-1/4">Features</th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="text-center py-4 px-3 font-semibold">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((cat, catIdx) => (
                    <React.Fragment key={catIdx}>
                      <tr className="bg-gray-800">
                        <td colSpan={5} className="py-2 px-4 font-semibold text-base">{cat.category}</td>
                      </tr>
                      {cat.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="border-b border-gray-800 hover:bg-gray-900">
                          <td className="py-3 px-4">{item.name}</td>
                          {item.plans.map((val, idx) => renderCell(val, idx))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">
            All plans billed {pricingType} in {selectedCurrency} unless specified otherwise. Pricing based on per-contact rates.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PricingDash;
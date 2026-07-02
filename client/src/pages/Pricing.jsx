import React, { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, Gift, Users, TrendingUp, Star, ArrowRight, Phone, Mail, Zap, BarChart, Globe, Shield, Smartphone, Package, Target, Send, Layout } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PageLayout from "../components/PageLayout"; // Adjust path as needed
import PricingEmailVerifi from "./PricingEmailVerifi";
import PricingMultiMedia from "./PricingMultiMedia"

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [contactCount, setContactCount] = useState(500);
  const [expandedSections, setExpandedSections] = useState({});
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [showMultiMedia, setShowMultiMedia] = useState(false);
  // Navigation hook
  const navigate = useNavigate();

  // Currency conversion rates (base: USD)
  const currencyRates = {
    USD: { symbol: '$', rate: 1, name: 'US Dollar' },
    EUR: { symbol: '€', rate: 0.92, name: 'Euro' },
    GBP: { symbol: '£', rate: 0.79, name: 'British Pound' },
    INR: { symbol: '₹', rate: 83.12, name: 'Indian Rupee' },
    AUD: { symbol: 'A$', rate: 1.53, name: 'Australian Dollar' },
    CAD: { symbol: 'C$', rate: 1.36, name: 'Canadian Dollar' },
    JPY: { symbol: '¥', rate: 149.50, name: 'Japanese Yen' },
    NZD: { symbol: 'NZ$', rate: 1.67, name: 'New Zealand Dollar' },
    NOK: { symbol: 'kr', rate: 10.87, name: 'Norwegian Krone' },
    SEK: { symbol: 'kr', rate: 10.96, name: 'Swedish Krona' },
    CHF: { symbol: 'CHF', rate: 0.88, name: 'Swiss Franc' }
  };

  // Billing periods without discounts
  const billingPeriods = {
    monthly: { 
      label: 'Monthly', 
      months: 1,
      displayText: 'per month',
    },
    quarterly: { 
      label: 'Quarterly', 
      months: 3,
      displayText: 'for 3 months',
    },
    
    yearly: { 
      label: 'Yearly', 
      months: 12,
      displayText: 'for 12 months',
    }
  };

  // Per-contact pricing rates as per image
  const perContactRates = {
    essentials: {
      500: 0.05,
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
    { value: 500, label: '500' },
    { value: 1000, label: '1,000' },
    { value: 1500, label: '1,500' },
    { value: 2500, label: '2,500' },
    { value: 5000, label: '5,000' },
    { value: 10000, label: '10,000' },
    { value: 15000, label: '15,000' },
    { value: 20000, label: '20,000' },
    { value: 25000, label: '25,000' },
    { value: 30000, label: '30,000' },
    { value: 40000, label: '40,000' },
    { value: 50000, label: '50,000' },
    { value: 75000, label: '75,000' },
    { value: 100000, label: '100,000' },
    { value: 150000, label: '150,000' },
    { value: 200000, label: '200,000' },
    { value: 250000, label: '250,000+' }
  ];

  // Function to get per-contact rate based on contact count
  const getPerContactRate = (planType, contacts) => {
    const rates = perContactRates[planType];
    if (!rates) return 0;
    
    // Find the appropriate tier
    if (contacts <= 500) return rates[500];
    if (contacts <= 2500) return rates[2500];
    if (contacts <= 5000) return rates[5000];
    if (contacts <= 10000) return rates[10000];
    if (contacts <= 20000) return rates[20000];
    if (contacts <= 30000) return rates[30000];
    if (contacts <= 40000) return rates[40000];
    return rates[50000];
  };

  const getCurrentPricing = () => {
    return {
      essentials: contactCount * getPerContactRate('essentials', contactCount),
      standard: contactCount * getPerContactRate('standard', contactCount),
      premium: contactCount * getPerContactRate('premium', contactCount)
    };
  };

  // Calculate price without billing period discount
  const calculatePrice = (monthlyPriceUSD) => {
    const periodInfo = billingPeriods[billingPeriod];
    return monthlyPriceUSD * periodInfo.months;
  };

  // Convert price to selected currency
  const convertPrice = (priceUSD) => {
    const rate = currencyRates[selectedCurrency].rate;
    const convertedPrice = priceUSD * rate;
    // Format based on currency (JPY has no decimals)
    if (selectedCurrency === 'JPY') {
      return Math.round(convertedPrice).toLocaleString();
    }
    return convertedPrice.toFixed(2);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currencyRates[selectedCurrency].symbol;
  };

  // Format price with currency symbol
  const formatPrice = (priceUSD) => {
    const symbol = getCurrencySymbol();
    const convertedPrice = convertPrice(priceUSD);
    
    // Special handling for CHF (symbol after amount)
    if (selectedCurrency === 'CHF') {
      return `${convertedPrice} ${symbol}`;
    }
    
    return `${symbol}${convertedPrice}`;
  };

  // Function to get plan-specific contact limit
  const getPlanContactLimit = (planType) => {
    switch(planType) {
      case 'free': return 500;
      case 'essentials': return 150000;
      case 'standard': return 150000;  // updated
      case 'premium': return Infinity;
      default: return contactCount;
    }
  };

  // Function to check if a plan is available for the selected contact count
  const isPlanAvailable = (planType) => {
    const planLimit = getPlanContactLimit(planType);
    return contactCount <= planLimit;
  };

  const plans = {
    free: {
      name: 'Free',
      tagline: 'Easily create email campaigns and learn more about your customers',
      icon: Gift,
      color: 'text-green-400',
      price: 0,
      disclaimer: '*Sending will be paused if contact or email send limit is exceeded.',
      cta: 'Sign Up',
      emailMultiplier: null,
      emailLimit: 50,
      features: ["Email marketing", "Basic reporting", "1 audience"]
    },
    essentials: {
      name: 'Essentials',
      tagline: 'Send the right content at the right time with testing and scheduling features',
      icon: Users,
      color: 'text-blue-400',
      cta: 'Buy Now',
      emailMultiplier: 1,
      emailValidationMultiplier: 0,
      features: ["Email marketing", "SMS marketing", "Marketing automation", "Basic support"]
    },
    standard: {
      name: 'Standard',
      tagline: 'Sell even more with personalization, optimization tools, and enhanced automations',
      icon: TrendingUp,
      color: 'text-[#c2831f]',
      badge: 'Best value',
      popular: true,
      cta: 'Buy Now',
      emailMultiplier: 1,
      emailValidationMultiplier: 1,
      features: ["Email marketing", "SMS marketing", "Advanced automation", "A/B testing", "24/7 support"]
    },
    premium: {
      name: 'Premium',
      tagline: 'Scale fast with dedicated onboarding, unlimited contacts, and priority support; built for teams',
      icon: Star,
      color: 'text-purple-400',
      cta: 'Buy Now',
      emailMultiplier: 1,
      emailValidationMultiplier: 1,
      smsWhatsappAccess: true,
      crmAccess: true,
      features: ["Email marketing", "SMS marketing", "Advanced automation", "A/B testing", "Priority support", "Custom integrations"]
    }
  };

  // Handle plan selection with navigation logic
const handlePlanSelection = (planName, planType) => {
  if (!isPlanAvailable(planType)) {
    alert(`The ${planName} plan is not available for ${contactCount.toLocaleString()} contacts. Please select a different plan or reduce your contact count.`);
    return;
  }

  const planData = plans[planType];
  const pricing = getCurrentPricing();
  const monthlyPriceUSD = planType === 'free' ? 0 : pricing[planType];
  const periodInfo = billingPeriods[billingPeriod];

  // ✅ Detect user login and previous purchase
  const isLoggedIn = !!localStorage.getItem("authToken") || !!localStorage.getItem("userEmail");
  const hasPurchasedBefore = localStorage.getItem("hasPurchasedBefore") === "true";
  const isNewUser = !hasPurchasedBefore;

  // ✅ Apply 50% discount only for first-time buyers
  const discountPercent = isNewUser ? 0.5 : 0;

  const discountedMonthlyPriceUSD = monthlyPriceUSD * (1 - discountPercent);
  const periodPriceUSD = calculatePrice(discountedMonthlyPriceUSD);
  const originalPeriodPriceUSD = calculatePrice(monthlyPriceUSD);

  // Convert to selected currency
  const baseMonthlyPriceConverted = parseFloat(convertPrice(discountedMonthlyPriceUSD).replace(/,/g, ''));
  const periodPriceConverted = parseFloat(convertPrice(periodPriceUSD).replace(/,/g, ''));
  const originalPeriodPriceConverted = parseFloat(convertPrice(originalPeriodPriceUSD).replace(/,/g, ''));

  // Calculate limits
  const emailSendLimit = planType === 'free'
    ? planData.emailLimit
    : contactCount * planData.emailMultiplier * periodInfo.months;

  const emailValidationLimit = planType === 'free'
    ? 0
    : contactCount * (planData.emailValidationMultiplier || 0) * periodInfo.months;

  // ✅ Build final plan details
  const planDetails = {
    planName,
    planType,
    originalBasePrice: originalPeriodPriceConverted,
    basePrice: periodPriceConverted,
    discountAmount: originalPeriodPriceConverted * discountPercent,
    periodPrice: periodPriceConverted,
    originalPeriodPrice: originalPeriodPriceConverted,
    billingPeriod: periodInfo.label.toLowerCase(),
    billingMonths: periodInfo.months,
    subtotal: periodPriceConverted,
    taxRate: 0.1,
    tax: periodPriceConverted * 0.1,
    totalCost: periodPriceConverted * 1.1,
    emails: emailSendLimit,
    emailValidations: emailValidationLimit,
    features: planData.features,
    slots: contactCount,
    contactCount,
    discount: discountPercent,
    discountApplied: isNewUser,
    isNewUser,
    currency: selectedCurrency,
    currencySymbol: getCurrencySymbol(),
    isFromPricingDash: false,
    pricingModel: "multiplier",
  };

  localStorage.setItem("pendingUpgradePlan", JSON.stringify(planDetails));
  sessionStorage.setItem("pendingUpgradePlan", JSON.stringify(planDetails));

  if (!isLoggedIn) {
    navigate("/signin", {
      state: { plan: planDetails, redirectTo: "/payment" },
    });
  } else {
    navigate("/payment", { state: { plan: planDetails } });
  }
};


  const keyPlanFeatures = {
    free: [
      { label: 'Marketing Automation Flows', value: 'Included' },
    ],
    essentials: [
      { label: 'Email Sending', value: 'Only email sending' },
      { label: 'Marketing Automation Flows', value: 'Up to 4 flow steps' }
    ],
    standard: [
      { label: 'Email Sending', value: 'Included' },
      { label: 'Email Validation', value: 'Included' },
      { label: 'Marketing Automation Flows', value: 'Up to 200 flow steps' }
    ],
    premium: [
      { label: 'Email Sending', value: 'Included' },
      { label: 'Email Validation', value: 'Included' },
      { label: 'SMS+ Whatsapp Campaign', value: 'Included' },
      { label: 'CRM', value: 'CRM access' },
      { label: 'Premium Migration Services', value: 'Contact Sales' },
      { label: 'Marketing Automation Flows', value: 'Up to 200 flow steps' }
    ]
  };

  const featureCategories = [
    {
      name: 'Core Features',
      icon: Mail,
      features: [
        { name: 'Email Scheduling', free: false, essentials: true, standard: true, premium: true },
        { name: 'Custom Templates', free: false, essentials: false, standard: true, premium: true },
        { name: 'Dynamic Content', free: false, essentials: false, standard: true, premium: true },
        { name: 'Advanced Insights', free: false, essentials: false, standard: true, premium: true }
      ]
    },
    {
      name: 'Contacts & Audience',
      icon: Users,
      features: [
        { name: 'Audiences', free: '1', essentials: '3', standard: '5', premium: 'Multiple' },
        { name: 'Tags', free: false, essentials: false, standard: false, premium: true },
        { name: 'Basic Segmentation', free: true, essentials: true, standard: true, premium: true },
        { name: 'Advanced Segmentation', free: false, essentials: false, standard: true, premium: true },
        { name: 'Contact Scoring', free: false, essentials: false, standard: true, premium: true },
        { name: 'Customer Lifetime Value', free: false, essentials: false, standard: true, premium: true }
      ]
    },
    {
      name: 'Email & Content Creation',
      icon: Layout,
      features: [
        { name: 'Email Campaigns', free: true, essentials: true, standard: true, premium: true },
        { name: 'Pre-built Templates', free: 'Limited', essentials: true, standard: true, premium: true },
        { name: 'Creative Assistant', free: 'Limited', essentials: 'Limited', standard: true, premium: true },
        { name: 'Custom-coded Templates', free: false, essentials: false, standard: true, premium: true },
        { name: 'Content Optimizer', free: false, essentials: false, standard: true, premium: true },
        { name: 'Dynamic Content', free: false, essentials: false, standard: true, premium: true },
      ]
    },
    {
      name: 'Marketing Automation',
      icon: Zap,
      features: [
        { name: 'Email Automation', free: 'Basic', essentials: true, standard: true, premium: true },
        { name: 'Automation Triggers', free: 'Limited', essentials: true, standard: true, premium: true },
      ]
    },
    {
      name: 'Reporting & Analytics',
      icon: BarChart,
      features: [
        { name: 'Basic Reporting', free: true, essentials: true, standard: true, premium: true },
        { name: 'Advanced Reporting', free: false, essentials: false, standard: true, premium: true },
        { name: 'Campaign Performance', free: true, essentials: true, standard: true, premium: true },
        { name: 'Click Map', free: true, essentials: true, standard: true, premium: true },
        { name: 'Content Optimizer', free: false, essentials: false, standard: true, premium: true },
        { name: 'Campaign Manager', free: false, essentials: false, standard: true, premium: true }
      ]
    },
    {
      name: 'Support & Services',
      icon: Phone,
      features: [
        { name: 'Email Support', free: true, essentials: true, standard: true, premium: true },
        { name: 'Chat Support', free: false, essentials: true, standard: true, premium: true },
        { name: '24/7 Support', free: false, essentials: false, standard: true, premium: true },
        { name: 'Phone Support', free: false, essentials: false, standard: false, premium: true },
        { name: 'Priority Support', free: false, essentials: false, standard: false, premium: true },
        { name: 'Onboarding', free: false, essentials: false, standard: 'Basic', premium: 'Dedicated' },
        { name: 'Personalized Onboarding', free: false, essentials: false, standard: false, premium: true }
      ]
    } 
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderFeatureValue = (value) => {
    if (value === true) return <Check className="w-5 h-5 text-[#c2831f] mx-auto" />;
    if (value === false) return <X className="w-5 h-5 text-gray-400 mx-auto" />;
    return <span className="text-sm text-gray-300 text-center block px-2">{value}</span>;
  };

  const PlanCard = ({ planKey, plan }) => {
    const pricing = getCurrentPricing();
    const monthlyPriceUSD = planKey === 'free' ? 0 : pricing[planKey];
    const periodInfo = billingPeriods[billingPeriod];
    
    // Apply 50% discount correctly
    const originalMonthlyUSD = monthlyPriceUSD;
    const hasPurchasedBefore = localStorage.getItem("hasPurchasedBefore") === "true";
    const isNewUser = !hasPurchasedBefore;
    const discountedMonthlyUSD = isNewUser ? originalMonthlyUSD * 0.5 : originalMonthlyUSD;
    const periodPriceUSD = calculatePrice(discountedMonthlyUSD);
    const originalPeriodPriceUSD = calculatePrice(originalMonthlyUSD);
    
    const Icon = plan.icon;
    const planContactLimit = getPlanContactLimit(planKey);
    const planAvailable = isPlanAvailable(planKey);
    
    // FIXED: Calculate email send limit based on plan type, contact count, and billing period
    const emailSendLimit = planKey === 'free' 
      ? plan.emailLimit 
      : contactCount * plan.emailMultiplier * periodInfo.months;
    
    // FIXED: Calculate email validation limit based on plan type, contact count, and billing period
    const emailValidationLimit = planKey === 'free' 
      ? 0 
      : contactCount * (plan.emailValidationMultiplier || 0) * periodInfo.months;
    
    return (
      <div className={`relative bg-gray-900 rounded-2xl border-2 ${
        plan.popular ? 'border-[#c2831f] shadow-lg' : 
        !planAvailable ? 'border-gray-800 opacity-60' : 'border-gray-700'
      } overflow-hidden transition-all hover:scale-[1.02] flex flex-col h-full`}>
        {plan.popular && (
          <div className="absolute top-0 left-0 right-0 bg-[#c2831f] text-white text-center py-2 text-sm font-bold z-10">
            {plan.badge.toUpperCase()}
          </div>
        )}
        
        {!planAvailable && (
          <div className="absolute top-0 left-0 right-0 bg-gray-700 text-white text-center py-2 text-sm font-bold z-10">
            NOT AVAILABLE
          </div>
        )}
        
        <div className={`p-6 flex-1 flex flex-col ${plan.popular ? 'pt-14' : ''} ${!planAvailable ? 'pt-14' : ''}`}>
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <Icon className={`w-8 h-8 ${plan.color} mr-3`} />
              <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-6 min-h-[60px]">{plan.tagline}</p>

          <div className="mb-6 border-b border-gray-700 pb-6">
            {planKey === 'free' && (
              <div className="text-4xl font-bold text-white mb-1">
                {formatPrice(0)}
                <span className="text-lg text-gray-300 font-normal"> per month</span>
              </div>
            )}
            {planKey !== 'free' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <div className="text-4xl font-bold text-white">
                    {formatPrice(periodPriceUSD)}
                    <span className="text-lg text-gray-300 font-normal">/{periodInfo.displayText}</span>
                  </div>
                </div>
                <div className="ml-0 sm:ml-2 flex flex-wrap gap-2 mt-2 sm:mt-0">
                  {isNewUser && (
                    <div className="text-green-500 font-bold text-[13px] bg-green-500/10 px-2 py-1 rounded">
                      50% OFF
                    </div>
                  )}

                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {formatPrice(getPerContactRate(planKey, contactCount))} per contact
                </div>
                <div className="ml-0 sm:ml-3 text-lg text-gray-400 line-through mt-1">
                  {formatPrice(originalPeriodPriceUSD)}
                </div>
              </>
            )}
            {plan.disclaimer && (
              <p className="text-xs text-gray-400 mt-2">{plan.disclaimer}</p>
            )}
          </div>

          <div className="mb-6 bg-gray-800 rounded-xl p-4">
            {/* Email Sending */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Email Sending:</span>
              <span className="text-sm font-semibold text-white">
                {emailSendLimit.toLocaleString()} emails
              </span>
            </div>

            {/* Email Validation - only for Standard and Premium */}
            {planKey !== 'free' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Email Validation:</span>
                <span className="text-sm font-semibold text-white">
                  {emailValidationLimit > 0 ? `${emailValidationLimit.toLocaleString()} validations` : 'Not included'}
                </span>
              </div>
            )}
          </div>

          <div className="mb-6 flex-1">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Key Plan Features</h4>
            <div className="space-y-3">
              {keyPlanFeatures[planKey].map((feature, idx) => (
                <div key={idx} className="border-b border-gray-800 pb-2 last:border-0">
                  <div className="text-xs text-gray-400 mb-1">{feature.label}</div>
                  <div className="text-sm text-white font-medium">{feature.value}</div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => handlePlanSelection(plan.name, planKey)}
            disabled={!planAvailable}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-all mt-auto ${
              plan.popular 
                ? 'bg-[#c2831f] text-white hover:bg-[#d0a042]' 
                : planAvailable
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {planAvailable ? plan.cta : 'Upgrade Required'}
            {planAvailable && <ArrowRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="min-h-screen text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-8 sm:mb-12 mt-15">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 py-5 text-[#c2831f]">
              Pricing Plans
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Choose the plan that fits your business needs. All plans include powerful email marketing, automation, and analytics.
            </p>
          </div>

          {/* Conditional Rendering: Show Email Verify OR Standard Plans */}
         {showEmailVerify ? (
            <PricingEmailVerifi 
              selectedCurrency={selectedCurrency}
              currencyRates={currencyRates}
              onClose={() => setShowEmailVerify(false)}
              navigate={navigate}
            />
          ) : showMultiMedia ? (
            <PricingMultiMedia 
              selectedCurrency={selectedCurrency}
              currencyRates={currencyRates}
              onClose={() => setShowMultiMedia(false)}
              navigate={navigate}
            />
          ) : (
            <>
               
              {/* 🔄 Billing Period Toggle + Email Verification Button (side by side) */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">

                {/* Billing Period Toggle */}
                <div className="flex justify-center">
                  <div className="bg-gray-800 rounded-xl p-1 inline-flex gap-7">
                    {Object.entries(billingPeriods).map(([key, period]) => (
                      <button
                        key={key}
                        onClick={() => setBillingPeriod(key)}
                        className={`py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                          billingPeriod === key
                            ? "bg-[#c2831f] text-white shadow-md shadow-[#c2831f]/30"
                            : "text-gray-300 hover:text-white hover:bg-gray-700/40"
                        }`}
                      >
                        <span className="text-sm">{period.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Verification Plans Button (Right side) */}
                <button
                  onClick={() => setShowEmailVerify(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white 
                            bg-[#c2831f] px-6 py-3 rounded-xl 
                            border-2 border-yellow-600 hover:from-blue-500 hover:to-blue-400 
                            hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-200"
                >
                  <Shield className="w-4 h-4" />
                  Email Verification Plans
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Email Verification Plans Button (Right side) */}
                <button
                  onClick={() => setShowMultiMedia(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white 
                            bg-[#c2831f] px-6 py-3 rounded-xl 
                            border-2 border-yellow-600 hover:from-blue-500 hover:to-blue-400 
                            hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-200"
                >
                  <Shield className="w-4 h-4" />
                  Multi Media Plans
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Contact Count and Currency Selectors */}
              <div className="max-w-4xl mx-auto mb-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Count Selector */}
                  <div>
                    <label className="block text-center text-sm font-medium text-gray-300 mb-3">
                      Number of Contacts
                    </label>
                    <div className="relative">
                      <select 
                        value={contactCount}
                        onChange={(e) => setContactCount(Number(e.target.value))}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:border-[#c2831f] focus:outline-none"
                      >
                        {contactTiers.map(tier => (
                          <option key={tier.value} value={tier.value}>
                            {tier.label} contacts
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {contactCount > 500 && (
                      <p className="text-sm text-yellow-400 mt-2 text-center">
                        Free plan is not available for more than 500 contacts
                      </p>
                    )}
                  </div>

                  {/* Currency Selector */}
                  <div>
                    <label className="block text-center text-sm font-medium text-gray-300 mb-3">
                      Select Your Currency
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:border-[#c2831f] focus:outline-none"
                      >
                        {Object.entries(currencyRates).map(([code, data]) => (
                          <option key={code} value={code}>
                            {data.symbol} {code} - {data.name}
                          </option>
                        ))}
                      </select>
                      <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {Object.entries(plans).map(([key, plan]) => (
                  <PlanCard key={key} planKey={key} plan={plan} />
                ))}
              </div>

              {/* Compare All Features Button */}
              <div className="text-center mb-12">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="inline-flex items-center px-8 py-4 bg-gray-800 border-2 border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all"
                >
                  {showComparison ? 'Hide' : 'Compare'} All Features
                  {showComparison ? <ChevronUp className="ml-2 w-5 h-5" /> : <ChevronDown className="ml-2 w-5 h-5" />}
                </button>
              </div>

              {/* Feature Comparison Table */}
              {showComparison && (
                <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 overflow-hidden mb-16">
                  <div className="overflow-x-auto overflow-y-auto max-h-[100vh] relative border-1 border-[#c2831f]">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-800 sticky top-0 z-30">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-300 sticky left-0 bg-gray-800 z-40 min-w-[200px]">
                            Features
                          </th>
                          <th className="p-4 font-semibold text-center min-w-[150px]"> 
                            <div className="flex items-center justify-center">
                              <Gift className="w-5 h-5 text-green-400 mr-2" />
                              Free
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-center min-w-[150px]">
                            <div className="flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-400 mr-2" />
                              Essentials
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-center min-w-[150px] bg-[#c2831f]/10">
                            <div className="flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-[#c2831f] mr-2" />
                              Standard
                              <span className="text-xs bg-[#c2831f] text-white px-2 py-0.5 ml-2 rounded-full inline-block">
                                Best value
                              </span>
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-center min-w-[150px]">
                            <div className="flex items-center justify-center">
                              <Star className="w-5 h-5 text-purple-400 mr-2" />
                              Premium
                            </div>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {featureCategories.map((category) => (
                          <React.Fragment key={category.name}>
                            <tr className="bg-gray-800 border-t-2 border-gray-700">
                              <td
                                colSpan={5}
                                className="p-4 sticky left-0 z-20 bg-gray-800"
                              >
                                <div className="flex items-center">
                                  <category.icon className="w-5 h-5 text-[#c2831f] mr-3" />
                                  <span className="font-semibold text-lg text-white">
                                    {category.name}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {category.features.map((feature, featureIdx) => (
                              <tr
                                key={featureIdx}
                                className={`border-t border-gray-700 hover:bg-gray-800 transition-colors ${
                                  featureIdx % 2 === 0 ? "bg-gray-900" : ""
                                }`}
                              >
                                <td className="p-4 text-gray-300 sticky left-0 bg-inherit z-10">
                                  {feature.name}
                                </td>
                                <td className="p-4 text-center">{renderFeatureValue(feature.free)}</td>
                                <td className="p-4 text-center">{renderFeatureValue(feature.essentials)}</td>
                                <td className="p-4 text-center bg-[#c2831f]/5">
                                  {renderFeatureValue(feature.standard)}
                                </td>
                                <td className="p-4 text-center">{renderFeatureValue(feature.premium)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-[#c2831f]/20 via-[#c2831f]/30 to-[#c2831f]/20 rounded-2xl border-2 border-[#c2831f]/50 p-8 sm:p-12 mb-16">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#c2831f]">Ready to Get Started?</h2>
                  <p className="text-gray-200 mb-8 text-lg">
                    Join thousands of businesses using our platform to grow their audience and increase revenue with powerful email marketing tools.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => handlePlanSelection("Standard", "standard")}
                      className="px-8 py-4 bg-[#c2831f] text-white rounded-xl font-semibold hover:bg-[#d0a042] transition-all flex items-center justify-center"
                    >
                      Buy Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                    <Link 
                      to="/login"
                      className="px-8 py-4 bg-gray-800 border-2 border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all flex items-center justify-center"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                </div>
                
              </div>
                {/* Footer Disclaimer */}
              <div className="mt-12 text-center text-xs text-gray-500 max-w-4xl mx-auto space-y-2 hide">
                <p>*Terms and conditions apply. Statistics based on platform user data.</p>
                <p>Prices may vary globally depending on your region and selected currency.</p>
                <p>Currency conversions are approximate and based on current exchange rates.</p>
                <p>Selected currency: {selectedCurrency} {currencyRates[selectedCurrency].symbol}</p>
              </div>
            </>
          )}
     
        </div>
      </div>
    </PageLayout>
  );
};

export default Pricing;
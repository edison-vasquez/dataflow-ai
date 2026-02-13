"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Database,
  ShieldCheck,
  Zap,
  Layers,
  LineChart,
  Cpu,
  Users,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-gray-900">
              DataFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {([
              { key: 'landingPlatform' as const, href: '#platform' },
              { key: 'landingSolutions' as const, href: '#solutions' },
              { key: 'landingSecurity' as const, href: '#security' },
              { key: 'landingPricingNav' as const, href: '#pricing' },
            ]).map((item) => (
              <a key={item.key} href={item.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                {t(item.key)}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all">
              {t('landingSignIn')}
            </Link>
            <Link
              href="/app"
              className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/10"
            >
              {t('landingGetStarted')}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary mb-8"
            >
              <Zap className="w-3 h-3 text-primary fill-current" />
              {t('landingAiPowered')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6"
            >
              {t('landingHeroTitle1')} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
                {t('landingHeroTitle2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-medium leading-relaxed"
            >
              {t('landingHeroDesc')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/app"
                className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-full text-base font-bold hover:scale-105 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                {t('landingLaunchWorkspace')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => window.open('mailto:contact@dataflow.ai?subject=Demo%20Request', '_blank')}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-6 py-3 rounded-full text-base font-bold transition-all"
              >
                {t('landingRequestDemo')}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview (Visual Placeholder) */}
        <section className="max-w-7xl mx-auto px-6 -mt-10 mb-20 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-gray-200 bg-white shadow-xl p-4 overflow-hidden"
          >
            <div className="rounded-xl bg-gray-50 border border-gray-200 aspect-[16/10] overflow-hidden flex flex-col">
              {/* Mock Header */}
              <div className="h-10 border-b border-gray-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-100 px-20 py-1 rounded-md border border-gray-200 text-[10px] text-gray-400">dataflow.ai/app</div>
                </div>
              </div>
              {/* Mock Content */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin-slow mx-auto" />
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 animate-pulse">{t('landingLoadingPlatform')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="platform" className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Database, nameKey: 'landingSmartIngestion' as const, descKey: 'landingSmartIngestionDesc' as const },
              { icon: ShieldCheck, nameKey: 'landingZeroTrust' as const, descKey: 'landingZeroTrustDesc' as const },
              { icon: Cpu, nameKey: 'landingWorkersAi' as const, descKey: 'landingWorkersAiDesc' as const },
              { icon: LineChart, nameKey: 'landingSmartViz' as const, descKey: 'landingSmartVizDesc' as const }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-xl bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">{t(feature.nameKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {t(feature.descKey)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Trust / Enterprise Section */}
        <section id="security" className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-8">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none text-gray-900">
                {t('landingEnterpriseSec')} <br />
                <span className="text-gray-400">{t('landingDataSecurity')}</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                {t('landingSecurityDesc')}
              </p>
              <div className="space-y-4">
                {[
                  t('landingSecFeature1'),
                  t('landingSecFeature2'),
                  t('landingSecFeature3'),
                  t('landingSecFeature4'),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 transition-opacity duration-700 group-hover:opacity-40" />
              <div className="relative aspect-square rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center p-8 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-video rounded-xl bg-white border border-gray-200 p-3 relative overflow-hidden">
                      <div className="w-1/2 h-2 bg-gray-200 rounded-full mb-2" />
                      <div className="w-3/4 h-2 bg-gray-100 rounded-full" />
                      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/20 rounded-full blur-xl" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl font-black tracking-tighter text-gray-900">{t('landingPricing')}</h2>
            <p className="text-gray-500 font-medium">{t('landingPricingDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { nameKey: 'landingStarter' as const, price: "0", features: ["1,000 rows/file", "Workers AI Basic", "Local Exports", "5 Active Projects"] },
              { nameKey: 'landingProfessional' as const, price: "49", popular: true, features: ["500,000 rows/file", "Full Llama 3.1 Access", "Cloudflare R2 Integration", "Priority Insights"] },
              { nameKey: 'landingEnterprise' as const, price: "Custom", features: ["Unlimited Rows", "Custom LLM Fine-tuning", "Dedicated DB Bindings", "SSO & Audit Logs"] }
            ].map((plan, i) => (
              <div
                key={i}
                className={cn(
                  "p-6 rounded-xl flex flex-col gap-8 transition-all relative overflow-hidden",
                  plan.popular
                    ? "bg-primary text-white scale-105 shadow-2xl shadow-primary/20 z-10"
                    : "bg-white border border-gray-200 text-gray-900"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-6 right-8 bg-white text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {t('landingMostPopular')}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-widest mb-2 opacity-80">{t(plan.nameKey)}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black leading-none">${plan.price}</span>
                    <span className="text-sm font-medium opacity-50">/month</span>
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  {plan.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Check className={cn("w-4 h-4 shrink-0", plan.popular ? "text-white" : "text-primary")} />
                      <span className="text-sm font-bold opacity-80">{feat}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/app"
                  className={cn(
                    "w-full py-4 rounded-2xl text-center text-sm font-black transition-all",
                    plan.popular ? "bg-white text-primary hover:bg-white/90" : "bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700"
                  )}
                >
                  {t('landingGetStarted')}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-gray-900">
              {t('landingCtaTitle')}
            </h2>
            <p className="text-lg text-gray-500 font-medium">
              {t('landingCtaDesc')}
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full text-base font-black hover:scale-110 transition-all shadow-3xl group"
            >
              {t('landingCtaButton')}
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter text-gray-900">DataFlow</span>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">
              {t('landingFooterTagline')}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-gray-400">{t('landingFooterProduct')}</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li><a href="#" className="hover:text-gray-900 transition-colors">{t('landingFooterWorkspace')}</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">{t('landingFooterAnalysis')}</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">{t('landingFooterIntegrations')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-gray-400">{t('landingFooterCompany')}</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li><a href="#" className="hover:text-gray-900 transition-colors">{t('landingFooterAbout')}</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">{t('landingFooterPrivacy')}</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">{t('landingFooterTerms')}</a></li>
            </ul>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-[10px] uppercase font-black tracking-wide text-gray-400">© 2026 DataFlow Systems Inc.</p>
            <p className="text-[10px] uppercase font-black tracking-wide text-gray-400 mt-2">{t('landingFooterRights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

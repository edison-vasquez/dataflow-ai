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
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              DataFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {["Platform", "Solutions", "Security", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm font-semibold hover:text-white/80 transition-all">
              Sign In
            </Link>
            <Link
              href="/app"
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition-all shadow-xl shadow-white/5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 mb-8"
            >
              <Zap className="w-3 h-3 text-primary fill-current" />
              Intelligence at the Edge
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
            >
              The Modern Standard for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
                Enterprise Data Science
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
            >
              Empower every team to import, transform, and visualize complex datasets in seconds with Cloudflare-native AI. Built for scale, engineered for simplicity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/app"
                className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-full text-base font-bold hover:scale-105 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                Launch Workspace
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => window.open('mailto:contact@dataflow.ai?subject=Demo%20Request', '_blank')}
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full text-base font-bold transition-all"
              >
                Request Demo
              </button>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview (Visual Placeholder) */}
        <section className="max-w-7xl mx-auto px-6 -mt-10 mb-32 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-4 shadow-[0_0_100px_rgba(37,99,235,0.15)] overflow-hidden"
          >
            <div className="rounded-[2rem] bg-[#0A0A0A] border border-white/5 aspect-[16/10] overflow-hidden flex flex-col">
              {/* Mock Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white/5 px-20 py-1 rounded-md border border-white/5 text-[10px] text-white/20">dataflow.ai/app</div>
                </div>
              </div>
              {/* Mock Content */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin-slow mx-auto" />
                  <p className="text-xs font-bold tracking-widest uppercase text-white/30 animate-pulse">Architecting Platform...</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="platform" className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Database, name: "Smart Ingestion", desc: "Native connectors for R2, D1, Google Sheets and REST APIs." },
              { icon: ShieldCheck, name: "Zero Trust Privacy", desc: "Your data never leaves the Cloudflare Edge. GDPR & HIPAA compliant logic." },
              { icon: Cpu, name: "Workers AI Core", desc: "Powered by Llama 3.1 70B for deep semantic data analysis." },
              { icon: LineChart, name: "Neural Visualization", desc: "Auto-generated Plotly dashboards based on data intent." }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Trust / Enterprise Section */}
        <section id="security" className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-20">
            <div className="md:w-1/2 space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Mission Critical <br />
                <span className="text-white/30">Infrastructure Security</span>
              </h2>
              <p className="text-lg text-white/50 leading-relaxed font-medium">
                Built natively on Cloudflare, DataFlow AI inherits enterprise-grade security headers, DDoS protection, and global edge distribution out of the box. No middleman servers between your data and insights.
              </p>
              <div className="space-y-4">
                {[
                  "End-to-end JWT encryption via Cloudflare Access",
                  "Privacy-first LLM processing (PII obfuscation)",
                  "Global Edge delivery for <50ms latency",
                  "SOC2 Type II & ISO 27001 roadmap"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="text-sm font-bold text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 transition-opacity duration-700 group-hover:opacity-40" />
              <div className="relative aspect-square rounded-[3rem] bg-white/[0.03] border border-white/10 flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-video rounded-2xl bg-white/5 border border-white/10 p-4 relative overflow-hidden">
                      <div className="w-1/2 h-2 bg-white/10 rounded-full mb-2" />
                      <div className="w-3/4 h-2 bg-white/5 rounded-full" />
                      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/20 rounded-full blur-xl" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black tracking-tighter">Enterprise-Ready Pricing</h2>
            <p className="text-white/40 font-medium">Clear, predictable scaling for teams of any size.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "0", features: ["1,000 rows/file", "Workers AI Basic", "Local Exports", "5 Active Projects"] },
              { name: "Professional", price: "49", popular: true, features: ["500,000 rows/file", "Full Llama 3.1 Access", "Cloudflare R2 Integration", "Priority Insights"] },
              { name: "Enterprise", price: "Custom", features: ["Unlimited Rows", "Custom LLM Fine-tuning", "Dedicated DB Bindings", "SSO & Audit Logs"] }
            ].map((plan, i) => (
              <div
                key={i}
                className={cn(
                  "p-10 rounded-[2.5rem] flex flex-col gap-8 transition-all relative overflow-hidden",
                  plan.popular
                    ? "bg-primary text-white scale-105 shadow-2xl shadow-primary/20 z-10"
                    : "bg-white/[0.03] border border-white/10 text-white"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-6 right-8 bg-white text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-widest mb-2 opacity-80">{plan.name}</h3>
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
                    plan.popular ? "bg-white text-primary hover:bg-white/90" : "bg-white/5 hover:bg-white/10 border border-white/10"
                  )}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 relative">
          <div className="absolute inset-0 bg-primary/20 opacity-30 blur-[150px] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
              Ready to transform <br />
              your data workflow?
            </h2>
            <p className="text-xl text-white/50 font-medium">
              Join performance-driven organizations leveraging edge-native AI to make sense of their complex datasets. Start for free today.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-3 bg-white text-black px-12 py-5 rounded-full text-lg font-black hover:scale-110 transition-all shadow-3xl group"
            >
              Build your first Workspace
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter">DataFlow</span>
            </div>
            <p className="text-sm text-white/30 font-medium leading-relaxed max-w-xs">
              The enterprise standard for AI-native data processing. Built on the Cloudflare Global Network.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 opacity-30">Product</h4>
            <ul className="space-y-4 text-sm font-bold text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">Workspace</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Analysis</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 opacity-30">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-20">© 2026 DataFlow Systems Inc.</p>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-20 mt-2">All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

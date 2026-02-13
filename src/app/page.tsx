import { Hero } from "@/components/hero";
import { TrustBar } from "@/components/trust-bar";
import { HowItWorks } from "@/components/how-it-works";
import { LiveActivity } from "@/components/live-activity";
import { AgentDemo } from "@/components/agent-demo";
import { Protocol } from "@/components/protocol";
import { WhyADP } from "@/components/why-adp";
import { Comparison } from "@/components/comparison";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <Navbar />
      <Hero />
      <AgentDemo />
      <TrustBar />
      <LiveActivity />
      <HowItWorks />
      <Protocol />
      <WhyADP />
      <Comparison />
      <CTA />
      <Footer />
    </div>
  );
}

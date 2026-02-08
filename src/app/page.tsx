import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Protocol } from "@/components/protocol";
import { WhyADP } from "@/components/why-adp";
import { LiveDemo } from "@/components/live-demo";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <Navbar />
      <Hero />
      <HowItWorks />
      <LiveDemo />
      <Protocol />
      <WhyADP />
      <CTA />
      <Footer />
    </div>
  );
}

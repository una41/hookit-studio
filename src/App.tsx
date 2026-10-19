import BackgroundVideo from './components/common/BackgroundVideo'
import TheHeader from './components/layout/TheHeader'
import TheFooter from './components/layout/TheFooter'
import HeroSection from './components/home/HeroSection'
import WhySection from './components/home/WhySection'
import ServiceSection from './components/home/ServiceSection'
import StrategySection from './components/home/StrategySection'
import ProcessSection from './components/home/ProcessSection'
import ContactSection from './components/home/ContactSection'

export default function App() {
  return (
    <>
      <BackgroundVideo />
      <TheHeader />
      <main>
        <HeroSection />
        <WhySection />
        <ServiceSection />
        <StrategySection />
        <ProcessSection />
        <ContactSection />
      </main>
      <TheFooter />
    </>
  )
}

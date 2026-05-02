import HomePage from "@/components/home/HomePage"
import PromoBannerBar from "@/components/promo-banner-bar"

export default function Page() {
  return (
    <>
      <PromoBannerBar scope="landing" />
      <HomePage />
    </>
  )
}

import PublicCmsRoutePage from "@/components/landing/public-cms-route-page"

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PublicCmsRoutePage slug={slug} />
}

import MiembrosClubPage from './MiembrosClubPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MiembrosClubPage clubId={id} />
}
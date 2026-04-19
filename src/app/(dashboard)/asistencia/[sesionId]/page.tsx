import MarcarAsistenciaPage from './MarcarAsistenciaPage'

interface Props {
  params: Promise<{ sesionId: string }>
}

export default async function Page({ params }: Props) {
  const { sesionId } = await params
  return <MarcarAsistenciaPage sesionId={sesionId} />
}

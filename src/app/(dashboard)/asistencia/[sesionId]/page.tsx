import MarcarAsistenciaPage from './MarcarAsistenciaPage'

interface Props {
  params: { sesionId: string }
}

export default function Page({ params }: Props) {
  return <MarcarAsistenciaPage sesionId={params.sesionId} />
}

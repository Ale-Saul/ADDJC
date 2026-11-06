'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import TodayIcon from '@mui/icons-material/Today'
import DownloadIcon from '@mui/icons-material/Download'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { CATEGORIES } from '@/constants/globales'
import { judokaController } from '@/controllers/judokaController'
import { senseiController } from '@/controllers/senseiController'
import { Judoka } from '@/models/judoka'
import { Sensei } from '@/models/sensei'
import { createClient } from '@/lib/supabase/client'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Props {
  clubId: string
  isSensei: boolean
  isEncargado: boolean
  isAdmin: boolean
  senseiId?: string
}

interface ItemConvocatoria {
  judoka: Judoka
  asistencias: number
  totalSesionesDisponibles: number
  fechasAsistidas: { fecha: string; titulo?: string | null }[]
  habilitado: boolean // asistencias >= 2
}

const getLunesSemana = (d: dayjs.Dayjs) => {
  const day = d.day() // 0 = Dom, 1 = Lun, ...
  const diff = day === 0 ? -6 : 1 - day
  return d.add(diff, 'day').startOf('day')
}

export default function ConvocatoriaSemanalTab({
  clubId,
  isSensei,
  isEncargado,
  isAdmin,
  senseiId,
}: Props) {
  // Offset semanal respecto a la semana actual (0 = actual, -1 = anterior, +1 = siguiente)
  const [semanaOffset, setSemanaOffset] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Datos base
  const [judokasClub, setJudokasClub] = useState<Judoka[]>([])
  const [entrenadores, setEntrenadores] = useState<Sensei[]>([])
  const [categoriasSensei, setCategoriasSensei] = useState<string[]>([])
  const [sesionesSemana, setSesionesSemana] = useState<any[]>([])
  const [asistenciasPresentes, setAsistenciasPresentes] = useState<any[]>([])

  // Filtros
  const [busqueda, setBusqueda] = useState<string>('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('all')
  const [entrenadorFiltro, setEntrenadorFiltro] = useState<string>('all')
  const [estadoFiltro, setEstadoFiltro] = useState<'all' | 'habilitados' | 'no_habilitados'>('all')

  // Fechas de la semana seleccionada
  const lunes = useMemo(() => {
    return getLunesSemana(dayjs().add(semanaOffset, 'week'))
  }, [semanaOffset])

  const domingo = useMemo(() => {
    return lunes.add(6, 'day').endOf('day')
  }, [lunes])

  const fechaInicioStr = useMemo(() => lunes.format('YYYY-MM-DD'), [lunes])
  const fechaFinStr = useMemo(() => domingo.format('YYYY-MM-DD'), [domingo])

  // Cargar categorías del sensei si es entrenador
  useEffect(() => {
    if (!isSensei || !senseiId) return
    let cancelled = false
    const loadSensei = async () => {
      const res = await senseiController.getSenseiById(senseiId)
      if (cancelled) return
      if (res.success && res.data) {
        setCategoriasSensei(Array.isArray(res.data.categorias) ? res.data.categorias : [])
      }
    }
    void loadSensei()
    return () => {
      cancelled = true
    }
  }, [isSensei, senseiId])

  // Cargar entrenadores del club
  useEffect(() => {
    if (!clubId) return
    let cancelled = false
    const loadEntrenadores = async () => {
      const res = await senseiController.getSenseisByClub(clubId)
      if (cancelled) return
      if (res.success && res.data) {
        setEntrenadores(res.data)
      }
    }
    void loadEntrenadores()
    return () => {
      cancelled = true
    }
  }, [clubId])

  // Cargar futbolistas y asistencias de la semana
  useEffect(() => {
    if (!clubId) return
    let cancelled = false

    const cargarDatos = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // 1. Futbolistas del club
        const resJudokas = await judokaController.getJudokasByClub(clubId)
        if (cancelled) return
        if (!resJudokas.success || !resJudokas.data) {
          setError(resJudokas.error || 'Error al cargar los futbolistas')
          setLoading(false)
          return
        }

        let listaJudokas = resJudokas.data

        // Si es entrenador, solo ve a sus propios alumnos
        if (isSensei && senseiId) {
          listaJudokas = listaJudokas.filter(j => {
            const esProfePrincipal = j.entrenador_id === senseiId
            const esProfeSecundario = j.entrenador_secundario_id === senseiId
            const esDeSuCategoria = Array.isArray(categoriasSensei) && j.categoria && categoriasSensei.includes(j.categoria)
            return esProfePrincipal || esProfeSecundario || esDeSuCategoria
          })
        }

        setJudokasClub(listaJudokas)

        // 2. Sesiones de entrenamiento de la semana
        const { data: sesiones, error: errSesiones } = await supabase
          .from('asistencia_sesiones')
          .select('id, fecha, categoria, sensei_id, titulo')
          .eq('club_id', clubId)
          .eq('activo', true)
          .gte('fecha', fechaInicioStr)
          .lte('fecha', fechaFinStr)

        if (errSesiones) throw errSesiones
        if (cancelled) return
        setSesionesSemana(sesiones || [])

        // 3. Asistencias presentes en esas sesiones
        if (sesiones && sesiones.length > 0) {
          const sesionIds = sesiones.map(s => s.id)
          const { data: detalles, error: errDetalles } = await supabase
            .from('asistencia_detalle')
            .select('sesion_id, judoka_id, estado')
            .in('sesion_id', sesionIds)
            .eq('estado', 'presente')

          if (errDetalles) throw errDetalles
          if (cancelled) return
          setAsistenciasPresentes(detalles || [])
        } else {
          setAsistenciasPresentes([])
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Error al consultar asistencias de la semana')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void cargarDatos()

    return () => {
      cancelled = true
    }
  }, [clubId, fechaInicioStr, fechaFinStr, isSensei, senseiId, categoriasSensei])

  // Mapear cada futbolista con su conteo semanal
  const itemsConvocatoria = useMemo<ItemConvocatoria[]>(() => {
    // Mapa de sesiones: sesionId -> sesion
    const mapSesiones = new Map<string, any>()
    sesionesSemana.forEach(s => mapSesiones.set(s.id, s))

    // Mapa de asistencias por judoka: judokaId -> sesiones asistidas
    const mapAsistencias = new Map<string, any[]>()
    asistenciasPresentes.forEach(a => {
      const arr = mapAsistencias.get(a.judoka_id) || []
      const ses = mapSesiones.get(a.sesion_id)
      if (ses) arr.push(ses)
      mapAsistencias.set(a.judoka_id, arr)
    })

    return judokasClub.map(j => {
      const sesionesAsistidas = mapAsistencias.get(j.id) || []
      // Fechas únicas asistidas
      const fechasMap = new Map<string, { fecha: string; titulo?: string | null }>()
      sesionesAsistidas.forEach(s => {
        if (!fechasMap.has(s.fecha)) {
          fechasMap.set(s.fecha, { fecha: s.fecha, titulo: s.titulo })
        }
      })
      const fechasArray = Array.from(fechasMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))
      const totalAsistencias = fechasArray.length

      // Total de sesiones dictadas para su categoría en la semana
      const sesionesDeCategoria = sesionesSemana.filter(s => !s.categoria || !j.categoria || s.categoria === j.categoria)

      return {
        judoka: j,
        asistencias: totalAsistencias,
        totalSesionesDisponibles: sesionesDeCategoria.length,
        fechasAsistidas: fechasArray,
        habilitado: totalAsistencias >= 2, // REGLA: MÍNIMO 2 ASISTENCIAS
      }
    })
  }, [judokasClub, sesionesSemana, asistenciasPresentes])

  // Filtrado final en memoria (rápido en vivo)
  const itemsFiltrados = useMemo(() => {
    return itemsConvocatoria.filter(item => {
      const j = item.judoka

      // 1. Búsqueda por texto (Nombre, Apellidos, CI, Posición)
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim()
        const nombreCompleto = `${j.nombres || ''} ${j.apellidos || ''}`.toLowerCase()
        const ciStr = (j.ci || '').toLowerCase()
        const posStr = (j.posicion || '').toLowerCase()
        const catStr = (j.categoria || '').toLowerCase()
        if (
          !nombreCompleto.includes(query) &&
          !ciStr.includes(query) &&
          !posStr.includes(query) &&
          !catStr.includes(query)
        ) {
          return false
        }
      }

      // 2. Filtro por categoría
      if (categoriaFiltro !== 'all') {
        if (j.categoria !== categoriaFiltro && j.categoria_secundaria !== categoriaFiltro) {
          return false
        }
      }

      // 3. Filtro por entrenador (solo encargado / admin)
      if (entrenadorFiltro !== 'all') {
        if (j.entrenador_id !== entrenadorFiltro && j.entrenador_secundario_id !== entrenadorFiltro) {
          return false
        }
      }

      // 4. Filtro por estado de habilitación
      if (estadoFiltro === 'habilitados' && !item.habilitado) return false
      if (estadoFiltro === 'no_habilitados' && item.habilitado) return false

      return true
    }).sort((a, b) => {
      // Ordenar: primero habilitados descendente por asistencias, luego por apellidos
      if (a.habilitado !== b.habilitado) return a.habilitado ? -1 : 1
      if (b.asistencias !== a.asistencias) return b.asistencias - a.asistencias
      return (a.judoka.apellidos || '').localeCompare(b.judoka.apellidos || '')
    })
  }, [itemsConvocatoria, busqueda, categoriaFiltro, entrenadorFiltro, estadoFiltro])

  // Métricas generales
  const totalEvaluados = itemsConvocatoria.length
  const totalHabilitados = itemsConvocatoria.filter(i => i.habilitado).length
  const totalNoHabilitados = totalEvaluados - totalHabilitados
  const pctHabilitados = totalEvaluados > 0 ? Math.round((totalHabilitados / totalEvaluados) * 100) : 0

  // Exportar lista oficial de convocados a PDF
  const exportarConvocatoriaPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Encabezado
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('COCHABAMBA FC', pageWidth / 2, 16, { align: 'center' })

    doc.setFontSize(12)
    doc.text('PLANILLA DE HABILITADOS Y CONVOCATORIA SEMANAL', pageWidth / 2, 23, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Semana evaluada: Lunes ${lunes.format('DD/MM/YYYY')} al Domingo ${domingo.format('DD/MM/YYYY')}`,
      pageWidth / 2,
      29,
      { align: 'center' }
    )

    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Regla oficial del club: Mínimo 2 asistencias a entrenamiento en la semana para ser convocado.', pageWidth / 2, 34, { align: 'center' })

    // Resumen
    doc.setDrawColor(200, 200, 200)
    doc.line(14, 37, pageWidth - 14, 37)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Jugadores: ${itemsFiltrados.length}`, 14, 42)
    doc.text(`Habilitados (>=2): ${itemsFiltrados.filter(i => i.habilitado).length}`, 75, 42)
    doc.text(`No habilitados: ${itemsFiltrados.filter(i => !i.habilitado).length}`, 135, 42)

    const tableData = itemsFiltrados.map((item, idx) => {
      const j = item.judoka
      const diasStr = item.fechasAsistidas.map(f => dayjs(f.fecha).format('ddd DD')).join(', ') || 'Sin asistencias'
      return [
        (idx + 1).toString(),
        `${j.apellidos}, ${j.nombres}`.toUpperCase(),
        j.categoria || '—',
        j.posicion || '—',
        j.nombre_entrenador || '—',
        diasStr,
        item.asistencias.toString(),
        item.habilitado ? 'HABILITADO' : 'NO HABILITADO'
      ]
    })

    autoTable(doc, {
      startY: 46,
      head: [['#', 'Futbolista', 'Categoría', 'Posición', 'Entrenador', 'Días asistidos', 'Asist.', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 28 },
        5: { cellWidth: 36 },
        6: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        7: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          if (data.cell.raw === 'HABILITADO') {
            data.cell.styles.textColor = [46, 125, 50] // Verde
          } else {
            data.cell.styles.textColor = [211, 47, 47] // Rojo
          }
        }
      }
    })

    doc.save(`Convocatoria_CochabambaFC_${lunes.format('YYYY-MM-DD')}.pdf`)
  }

  const opcionesCategorias = useMemo(() => {
    if (isSensei && categoriasSensei.length > 0) {
      return categoriasSensei
    }
    return CATEGORIES
  }, [isSensei, categoriasSensei])

  return (
    <Box>
      {/* ── Barra de Navegación Semanal ── */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <EmojiEventsIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Convocatoria para el Fin de Semana
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⚽ Regla: Se requiere un <strong>mínimo de 2 asistencias</strong> en la semana para ser convocado.
            </Typography>
          </Box>
        </Stack>

        {/* Controles de Semana */}
        <Stack direction="row" alignItems="center" spacing={1} justifyContent={{ xs: 'center', md: 'flex-end' }}>
          <Tooltip title="Semana anterior">
            <IconButton size="small" onClick={() => setSemanaOffset(prev => prev - 1)}>
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Chip
            icon={<TodayIcon />}
            label={`Semana: ${lunes.format('DD MMM')} — ${domingo.format('DD MMM YYYY')}`}
            color={semanaOffset === 0 ? 'primary' : 'default'}
            variant={semanaOffset === 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 'bold', px: 1 }}
          />

          <Tooltip title="Semana siguiente">
            <IconButton size="small" onClick={() => setSemanaOffset(prev => prev + 1)}>
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {semanaOffset !== 0 && (
            <Button
              size="small"
              variant="text"
              onClick={() => setSemanaOffset(0)}
              sx={{ textTransform: 'none', fontSize: '0.8rem' }}
            >
              Semana actual
            </Button>
          )}

          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={exportarConvocatoriaPDF}
            disabled={itemsFiltrados.length === 0}
            sx={{ textTransform: 'none', ml: 1 }}
          >
            Descargar Convocados (PDF)
          </Button>
        </Stack>
      </Paper>

      {/* ── Tarjetas de Resumen ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {isSensei ? 'Mis Alumnos' : 'Futbolistas del Club'}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {totalEvaluados}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'success.light', bgcolor: 'rgba(46, 125, 50, 0.04)' }}>
          <Typography variant="caption" color="success.main" fontWeight="bold">
            🟢 Habilitados (≥ 2 asistencias)
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="success.main">
            {totalHabilitados} <Typography component="span" variant="caption" color="text.secondary">({pctHabilitados}%)</Typography>
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'error.light', bgcolor: 'rgba(211, 47, 47, 0.04)' }}>
          <Typography variant="caption" color="error.main" fontWeight="bold">
            🔴 No Habilitados (&lt; 2 asistencias)
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="error.main">
            {totalNoHabilitados}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Entrenamientos en la Semana
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {sesionesSemana.length}
          </Typography>
        </Paper>
      </Box>

      {/* ── Barra de Filtros y Buscador ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          {/* Buscador de texto */}
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar futbolista por nombre, apellido, CI o posición..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Filtro de Categoría */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 } }}>
            <InputLabel id="cat-convocatoria-label">Categoría</InputLabel>
            <Select
              labelId="cat-convocatoria-label"
              label="Categoría"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <MenuItem value="all">Todas las categorías</MenuItem>
              {opcionesCategorias.map(c => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filtro de Entrenador (solo Encargado o Admin) */}
          {(isEncargado || isAdmin) && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
              <InputLabel id="ent-convocatoria-label">Entrenador</InputLabel>
              <Select
                labelId="ent-convocatoria-label"
                label="Entrenador"
                value={entrenadorFiltro}
                onChange={(e) => setEntrenadorFiltro(e.target.value)}
              >
                <MenuItem value="all">Todos los entrenadores</MenuItem>
                {entrenadores.map(ent => (
                  <MenuItem key={ent.id} value={ent.id}>
                    {ent.nombres} {ent.apellidos}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Filtro de Estado Habilitación */}
          <ToggleButtonGroup
            value={estadoFiltro}
            exclusive
            onChange={(_, val) => val && setEstadoFiltro(val)}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            <ToggleButton value="all">Todos</ToggleButton>
            <ToggleButton value="habilitados" sx={{ color: 'success.main', fontWeight: 600 }}>
              Habilitados
            </ToggleButton>
            <ToggleButton value="no_habilitados" sx={{ color: 'error.main', fontWeight: 600 }}>
              No Habilitados
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* ── Tabla de Habilitados ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Evaluando asistencias de la semana...
          </Typography>
        </Box>
      ) : itemsFiltrados.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <SportsSoccerIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            No se encontraron futbolistas para los filtros seleccionados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intenta cambiar de categoría, buscar otro nombre o revisar otra semana.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Futbolista</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría / Posición</TableCell>
                {(isEncargado || isAdmin) && (
                  <TableCell sx={{ fontWeight: 'bold' }}>Entrenador</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold' }}>Días asistidos esta semana</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Asistencias</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado de Convocatoria</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsFiltrados.map((item) => {
                const j = item.judoka
                return (
                  <TableRow
                    key={j.id}
                    hover
                    sx={{
                      bgcolor: item.habilitado ? 'inherit' : 'rgba(211, 47, 47, 0.015)',
                    }}
                  >
                    {/* Futbolista */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={j.avatar_url || undefined}
                          sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: '0.85rem' }}
                        >
                          {(j.nombres?.[0] || 'F').toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            {j.apellidos}, {j.nombres}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            CI: {j.ci || 'Sin CI'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Categoría / Posición */}
                    <TableCell>
                      <Stack spacing={0.3}>
                        <Chip
                          label={j.categoria || 'Sin categoría'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500, alignSelf: 'flex-start' }}
                        />
                        {j.posicion && (
                          <Typography variant="caption" color="text.secondary">
                            ⚽ {j.posicion}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    {/* Entrenador (solo encargado / admin) */}
                    {(isEncargado || isAdmin) && (
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {j.nombre_entrenador || '—'}
                        </Typography>
                        {j.nombre_entrenador_secundario && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Sec: {j.nombre_entrenador_secundario}
                          </Typography>
                        )}
                      </TableCell>
                    )}

                    {/* Días Asistidos */}
                    <TableCell>
                      {item.fechasAsistidas.length > 0 ? (
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {item.fechasAsistidas.map((fa, idx) => (
                            <Chip
                              key={idx}
                              icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                              label={`${dayjs(fa.fecha).format('ddd DD/MM')}`}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.72rem', height: 22 }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin asistencias en la semana
                        </Typography>
                      )}
                    </TableCell>

                    {/* Total Asistencias */}
                    <TableCell align="center">
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color={item.habilitado ? 'success.main' : 'error.main'}
                      >
                        {item.asistencias}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.asistencias === 1 ? 'entrenamiento' : 'entrenamientos'}
                      </Typography>
                    </TableCell>

                    {/* Estado de Convocatoria */}
                    <TableCell align="center">
                      {item.habilitado ? (
                        <Chip
                          icon={<SportsSoccerIcon sx={{ fontSize: 16 }} />}
                          label="HABILITADO PARA JUGAR"
                          color="success"
                          sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon sx={{ fontSize: 16 }} />}
                          label={
                            item.asistencias === 1
                              ? 'NO HABILITADO (Falta 1)'
                              : 'NO HABILITADO (0 asist.)'
                          }
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
